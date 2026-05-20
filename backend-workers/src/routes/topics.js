import { successResponse, errorResponse } from '../utils.js';
import { roleAuth } from '../middleware.js';

export async function handleTopics(request, env, user) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /api/topics - 获取课题列表
  if (pathname === '/api/topics' && request.method === 'GET') {
    try {
      let query = 'SELECT t.*, u.real_name as teacher_name FROM topic t LEFT JOIN user u ON t.teacher_id = u.id';
      const params = [];

      if (user?.role === 'student') {
        query += ' WHERE t.status = ?';
        params.push('open');
      }

      query += ' ORDER BY t.created_at DESC';
      
      const { results } = await env.DB.prepare(query).bind(...params).all();
      return successResponse(results);
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // POST /api/topics - 创建课题（需要教师权限）
  if (pathname === '/api/topics' && request.method === 'POST') {
    if (!user || !roleAuth('teacher', 'admin')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const { title, description, requirements, max_students } = await request.json();
      await env.DB.prepare(
        'INSERT INTO topic (title, description, requirements, teacher_id, max_students) VALUES (?, ?, ?, ?, ?)'
      ).bind(title, description, requirements, user.id, max_students || 1).run();

      return successResponse(null, '课题创建成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // PUT /api/topics/:id - 更新课题
  const topicIdMatch = pathname.match(/^\/api\/topics\/(\d+)$/);
  if (topicIdMatch && request.method === 'PUT') {
    if (!user || !roleAuth('teacher', 'admin')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const topicId = topicIdMatch[1];
      const { title, description, requirements, max_students, status } = await request.json();
      
      await env.DB.prepare(
        'UPDATE topic SET title = ?, description = ?, requirements = ?, max_students = ?, status = ? WHERE id = ?'
      ).bind(title, description, requirements, max_students, status, topicId).run();

      return successResponse(null, '更新成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // DELETE /api/topics/:id - 删除课题
  if (topicIdMatch && request.method === 'DELETE') {
    if (!user || !roleAuth('teacher', 'admin')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const topicId = topicIdMatch[1];
      await env.DB.prepare('DELETE FROM topic WHERE id = ?').bind(topicId).run();
      return successResponse(null, '删除成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  return null;
}
