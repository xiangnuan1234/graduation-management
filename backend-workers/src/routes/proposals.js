import { successResponse, errorResponse } from '../utils.js';
import { roleAuth } from '../middleware.js';
import { checkUploadAllowed } from '../utils/r2-monitor.js';

export async function handleProposals(request, env, user) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /api/proposals - 获取开题报告列表
  if (pathname === '/api/proposals' && request.method === 'GET') {
    try {
      let query = 'SELECT p.*, u.real_name as student_name FROM proposal p LEFT JOIN user u ON p.student_id = u.id';
      const params = [];

      if (user?.role === 'student') {
        query += ' WHERE p.student_id = ?';
        params.push(user.id);
      }

      query += ' ORDER BY p.created_at DESC';
      
      const { results } = await env.DB.prepare(query).bind(...params).all();
      return successResponse(results);
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // POST /api/proposals - 提交开题报告（学生）
  if (pathname === '/api/proposals' && request.method === 'POST') {
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
        const key = `proposals/${uuid}.${ext}`;

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

      // 保存记录到数据库
      if (fileData) {
        await env.DB.prepare(
          'INSERT INTO proposal (student_id, file_path, file_data, status) VALUES (?, ?, ?, ?)'
        ).bind(user.id, filePath, fileData, 'submitted').run();
      } else {
        await env.DB.prepare(
          'INSERT INTO proposal (student_id, file_path, status) VALUES (?, ?, ?)'
        ).bind(user.id, filePath, 'submitted').run();
      }

      const message = env.FILES ? '提交成功' : '提交成功（文件已保存到数据库）';
      return successResponse(null, message);
    } catch (error) {
      console.error('Error in POST /api/proposals:', error);
      return errorResponse(error.message, 500);
    }
  }

  // PUT /api/proposals/:id/review - 评阅开题报告（教师）
  const proposalIdMatch = pathname.match(/^\/api\/proposals\/(\d+)\/review$/);
  if (proposalIdMatch && request.method === 'PUT') {
    if (!user || !roleAuth('teacher')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const proposalId = proposalIdMatch[1];
      const { status, score, comment } = await request.json();
      
      await env.DB.prepare(
        'UPDATE proposal SET status = ?, score = ?, comment = ?, review_time = datetime(\'now\') WHERE id = ?'
      ).bind(status, score || null, comment || null, proposalId).run();

      return successResponse(null, '评阅成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // GET /api/proposals/:id/file - 获取文件内容
  const fileIdMatch = pathname.match(/^\/api\/proposals\/(\d+)\/file$/);
  if (fileIdMatch && request.method === 'GET') {
    try {
      const proposalId = fileIdMatch[1];
      const result = await env.DB.prepare(
        'SELECT file_path, file_data FROM proposal WHERE id = ?'
      ).bind(proposalId).first();

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
      console.error('Error in GET /api/proposals/:id/file:', error);
      return errorResponse(error.message, 500);
    }
  }

  return null;
}
