import { successResponse, errorResponse } from '../utils.js';
import { roleAuth } from '../middleware.js';

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
      const formData = await request.formData();
      const file = formData.get('file');
      
      if (!file) {
        return errorResponse('请上传文件', 400);
      }

      let filePath = null;
      
      // 如果 R2 已配置，上传到 R2
      if (env.FILES) {
        const uuid = crypto.randomUUID();
        const ext = file.name.split('.').pop();
        const key = `proposals/${uuid}.${ext}`;

        await env.FILES.put(key, file.stream(), {
          httpMetadata: { contentType: file.type }
        });
        
        filePath = key;
      } else {
        // R2 未配置时，只存储文件信息，不存储实际文件
        const uuid = crypto.randomUUID();
        const ext = file.name.split('.').pop();
        filePath = `not_configured/${uuid}.${ext}`;
        console.warn('R2 not configured, file info saved but file not stored');
      }

      // 保存记录到数据库
      await env.DB.prepare(
        'INSERT INTO proposal (student_id, file_path, status) VALUES (?, ?, ?)'
      ).bind(user.id, filePath, 'submitted').run();

      const message = env.FILES ? '提交成功' : '提交成功（文件信息已保存）';
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

  return null;
}
