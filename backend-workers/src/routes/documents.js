import { successResponse, errorResponse } from '../utils.js';
import { roleAuth } from '../middleware.js';
import { checkUploadAllowed } from '../utils/r2-monitor.js';

export async function handleDocuments(request, env, user) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /api/documents - 获取文档列表
  if (pathname === '/api/documents' && request.method === 'GET') {
    try {
      let query = 'SELECT d.*, u.real_name as student_name FROM document d LEFT JOIN user u ON d.student_id = u.id';
      const params = [];

      if (user?.role === 'student') {
        query += ' WHERE d.student_id = ?';
        params.push(user.id);
      }

      query += ' ORDER BY d.uploaded_at DESC';
      
      const { results } = await env.DB.prepare(query).bind(...params).all();
      return successResponse(results);
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // POST /api/documents - 上传文档（学生）
  if (pathname === '/api/documents' && request.method === 'POST') {
    if (!user || !roleAuth('student')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      // 检查 R2 额度是否允许上传
      const uploadCheck = await checkUploadAllowed(env);
      if (!uploadCheck.allowed) {
        return errorResponse(uploadCheck.reason, 403);
      }

      const formData = await request.formData();
      const file = formData.get('file');
      
      if (!file) {
        return errorResponse('请上传文件', 400);
      }

      // 检查文件大小
      const fileSize = file.size;
      if (fileSize > uploadCheck.maxFileSize) {
        return errorResponse(`文件大小超过限制。当前最大允许: ${uploadCheck.maxFileSizeFormatted}`, 400);
      }

      let filePath = null;
      let fileData = null;
      
      // 如果 R2 已配置，上传到 R2
      if (env.FILES) {
        const uuid = crypto.randomUUID();
        const ext = file.name.split('.').pop();
        const key = `documents/${uuid}.${ext}`;

        await env.FILES.put(key, file.stream(), {
          httpMetadata: { contentType: file.type }
        });
        
        filePath = key;
        console.log(`File uploaded to R2: ${key}, size: ${fileSize} bytes`);
      } else {
        // R2 未配置时，将文件转为 Base64 存储在数据库
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // 检查文件大小（限制为 5MB）
        if (bytes.length > 5 * 1024 * 1024) {
          return errorResponse('文件大小不能超过 5MB', 400);
        }
        
        // 转换为 Base64
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        fileData = btoa(binary);
        
        const uuid = crypto.randomUUID();
        const ext = file.name.split('.').pop();
        filePath = `db_storage/${uuid}.${ext}`;
        console.log(`File converted to Base64, size: ${bytes.length} bytes`);
      }

      // 获取当前版本
      const versionResult = await env.DB.prepare(
        'SELECT MAX(version) as max_version FROM document WHERE student_id = ?'
      ).bind(user.id).first();
      
      const version = (versionResult?.max_version || 0) + 1;

      // 保存记录到数据库
      if (fileData) {
        await env.DB.prepare(
          'INSERT INTO document (student_id, version, file_path, file_name, file_data, status) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(user.id, version, filePath, file.name, fileData, 'submitted').run();
      } else {
        await env.DB.prepare(
          'INSERT INTO document (student_id, version, file_path, file_name, status) VALUES (?, ?, ?, ?, ?)'
        ).bind(user.id, version, filePath, file.name, 'submitted').run();
      }

      const message = env.FILES ? '上传成功' : '上传成功（文件已保存到数据库）';
      return successResponse(null, message);
    } catch (error) {
      console.error('Error in POST /api/documents:', error);
      return errorResponse(error.message, 500);
    }
  }

  // GET /api/documents/:id/file - 获取文件内容
  const fileIdMatch = pathname.match(/^\/api\/documents\/(\d+)\/file$/);
  if (fileIdMatch && request.method === 'GET') {
    try {
      const documentId = fileIdMatch[1];
      const result = await env.DB.prepare(
        'SELECT file_path, file_data FROM document WHERE id = ?'
      ).bind(documentId).first();

      if (!result || !result.file_path) {
        return errorResponse('文件不存在', 404);
      }

      // 如果有 file_data，说明是 Base64 存储在数据库中
      if (result.file_data) {
        // 解码 Base64
        const binaryString = atob(result.file_data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // 推断 MIME 类型
        let contentType = 'application/octet-stream';
        if (result.file_path.endsWith('.pdf')) contentType = 'application/pdf';
        else if (result.file_path.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (result.file_path.endsWith('.doc')) contentType = 'application/msword';

        return new Response(bytes, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${result.file_path.split('/').pop()}"`,
            'Access-Control-Allow-Origin': request.headers.get('Origin') || env.FRONTEND_URL || '*'
          }
        });
      } 
      // 否则从 R2 获取
      else if (env.FILES) {
        console.log(`Fetching file from R2: ${result.file_path}`);
        const object = await env.FILES.get(result.file_path);
        if (!object) {
          console.error(`File not found in R2: ${result.file_path}`);
          return errorResponse('文件不存在于存储中', 404);
        }

        // 验证文件大小
        const size = object.size;
        console.log(`File size from R2: ${size} bytes`);
        
        if (size === 0) {
          console.error(`File is empty in R2: ${result.file_path}`);
          return errorResponse('文件为空，可能已损坏', 500);
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Content-Disposition', `attachment; filename="${result.file_path.split('/').pop()}"`);
        headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || env.FRONTEND_URL || '*');
        headers.set('Content-Length', size.toString());

        return new Response(object.body, {
          headers
        });
      } else {
        return errorResponse('文件存储未配置', 503);
      }
    } catch (error) {
      console.error('Error in GET /api/documents/:id/file:', error);
      return errorResponse(error.message, 500);
    }
  }

  // PUT /api/documents/:id/status - 更新文档状态（教师）
  const statusIdMatch = pathname.match(/^\/api\/documents\/(\d+)\/status$/);
  if (statusIdMatch && request.method === 'PUT') {
    if (!user || !roleAuth('teacher')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const documentId = statusIdMatch[1];
      const { status } = await request.json();
      
      if (!['draft', 'submitted', 'reviewed'].includes(status)) {
        return errorResponse('无效的状态值', 400);
      }

      await env.DB.prepare(
        'UPDATE document SET status = ? WHERE id = ?'
      ).bind(status, documentId).run();

      return successResponse(null, '状态更新成功');
    } catch (error) {
      console.error('Error in PUT /api/documents/:id/status:', error);
      return errorResponse(error.message, 500);
    }
  }

  // DELETE /api/documents/:id - 删除文档（学生或教师）
  const deleteDocumentMatch = pathname.match(/^\/api\/documents\/(\d+)$/);
  if (deleteDocumentMatch && request.method === 'DELETE') {
    if (!user) {
      return errorResponse('未登录', 401);
    }

    try {
      const documentId = deleteDocumentMatch[1];
      
      // 查询文档信息
      const doc = await env.DB.prepare(
        'SELECT * FROM document WHERE id = ?'
      ).bind(documentId).first();

      if (!doc) {
        return errorResponse('文档不存在', 404);
      }

      // 权限检查：学生只能删除自己的，教师可以删除任何
      if (user.role === 'student' && doc.student_id !== user.id) {
        return errorResponse('权限不足', 403);
      }

      // 如果文件存储在 R2 中，删除 R2 文件
      if (doc.file_path && env.FILES && !doc.file_data) {
        try {
          await env.FILES.delete(doc.file_path);
          console.log(`Deleted file from R2: ${doc.file_path}`);
        } catch (err) {
          console.error(`Failed to delete file from R2: ${doc.file_path}`, err);
        }
      }

      // 删除数据库记录
      await env.DB.prepare(
        'DELETE FROM document WHERE id = ?'
      ).bind(documentId).run();

      return successResponse(null, '删除成功');
    } catch (error) {
      console.error('Error in DELETE /api/documents/:id:', error);
      return errorResponse(error.message, 500);
    }
  }

  return null;
}
