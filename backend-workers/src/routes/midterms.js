import { successResponse, errorResponse } from '../utils.js';
import { roleAuth } from '../middleware.js';

export async function handleMidterms(request, env, user) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /api/midterms - 获取中期检查列表
  if (pathname === '/api/midterms' && request.method === 'GET') {
    try {
      let query = 'SELECT m.*, u.real_name as student_name FROM midterm m LEFT JOIN user u ON m.student_id = u.id';
      const params = [];

      if (user?.role === 'student') {
        query += ' WHERE m.student_id = ?';
        params.push(user.id);
      }

      query += ' ORDER BY m.created_at DESC';
      
      const { results } = await env.DB.prepare(query).bind(...params).all();
      return successResponse(results);
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // POST /api/midterms - 提交中期检查（学生）
  if (pathname === '/api/midterms' && request.method === 'POST') {
    if (!user || !roleAuth('student')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const { progress, problems, plan } = await request.json();
      await env.DB.prepare(
        'INSERT INTO midterm (student_id, progress, problems, plan, status) VALUES (?, ?, ?, ?, ?)'
      ).bind(user.id, progress, problems, plan, 'submitted').run();

      return successResponse(null, '提交成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // PUT /api/midterms/:id/review - 评阅中期检查（教师）
  const midtermIdMatch = pathname.match(/^\/api\/midterms\/(\d+)\/review$/);
  if (midtermIdMatch && request.method === 'PUT') {
    if (!user || !roleAuth('teacher')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const midtermId = midtermIdMatch[1];
      const { status, score } = await request.json();
      
      await env.DB.prepare(
        'UPDATE midterm SET status = ?, score = ? WHERE id = ?'
      ).bind(status, score || null, midtermId).run();

      return successResponse(null, '评阅成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  return null;
}
