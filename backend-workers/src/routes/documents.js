import { successResponse, errorResponse } from '../utils.js';
import { roleAuth } from '../middleware.js';

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
      const formData = await request.formData();
      const file = formData.get('file');
      
      if (!file) {
        return errorResponse('请上传文件', 400);
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

      if (!result || !result.file_data) {
        return errorResponse('文件不存在', 404);
      }

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
          'Content-Disposition': `attachment; filename="${result.file_path}"`
        }
      });
    } catch (error) {
      console.error('Error in GET /api/documents/:id/file:', error);
      return errorResponse(error.message, 500);
    }
  }

  return null;
}
