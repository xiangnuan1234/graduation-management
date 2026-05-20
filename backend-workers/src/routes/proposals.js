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

      // 检查 R2 是否配置
      if (!env.FILES) {
        return errorResponse('文件存储功能未配置，请联系管理员启用 R2', 503);
      }

      // 生成唯一文件名
      const uuid = crypto.randomUUID();
      const ext = file.name.split('.').pop();
      const key = `proposals/${uuid}.${ext}`;

      // 上传到 R2
      await env.FILES.put(key, file.stream(), {
        httpMetadata: { contentType: file.type }
      });

      // 保存记录到数据库
      await env.DB.prepare(
        'INSERT INTO proposal (student_id, file_path, status) VALUES (?, ?, ?)'
      ).bind(user.id, key, 'submitted').run();

      return successResponse(null, '提交成功');
    } catch (error) {
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
