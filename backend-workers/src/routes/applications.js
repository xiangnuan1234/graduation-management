import { successResponse, errorResponse } from '../utils.js';
import { roleAuth } from '../middleware.js';

export async function handleApplications(request, env, user) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /api/applications - 获取申请列表
  if (pathname === '/api/applications' && request.method === 'GET') {
    try {
      let query = 'SELECT a.*, t.title as topic_title, u.real_name as student_name FROM application a LEFT JOIN topic t ON a.topic_id = t.id LEFT JOIN user u ON a.student_id = u.id';
      const params = [];

      if (user?.role === 'student') {
        query += ' WHERE a.student_id = ?';
        params.push(user.id);
      } else if (user?.role === 'teacher') {
        query += ' WHERE t.teacher_id = ?';
        params.push(user.id);
      }

      query += ' ORDER BY a.apply_time DESC';
      
      console.log('Query:', query, 'Params:', params);
      const { results } = await env.DB.prepare(query).bind(...params).all();
      console.log('Results:', results);
      return successResponse(results || []);
    } catch (error) {
      console.error('Error in GET /api/applications:', error);
      return errorResponse(error.message, 500);
    }
  }

  // POST /api/applications - 提交申请（学生）
  if (pathname === '/api/applications' && request.method === 'POST') {
    if (!user || !roleAuth('student')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const data = await request.json();
      // 支持两种格式：{ topic_id, priority } 或 { topic_ids: [...] }
      let topicId;
      if (data.topic_ids && Array.isArray(data.topic_ids) && data.topic_ids.length > 0) {
        topicId = data.topic_ids[0];
      } else {
        topicId = data.topic_id;
      }
      
      if (!topicId) {
        return errorResponse('请选择要申请的课题', 400);
      }
      
      const priority = data.priority || 1;
      
      // 检查是否已经申请过该课题
      const existing = await env.DB.prepare(
        'SELECT id FROM application WHERE topic_id = ? AND student_id = ?'
      ).bind(topicId, user.id).first();
      
      if (existing) {
        return errorResponse('您已经申请过该课题', 400);
      }
      
      await env.DB.prepare(
        'INSERT INTO application (topic_id, student_id, priority) VALUES (?, ?, ?)'
      ).bind(topicId, user.id, priority).run();

      return successResponse(null, '申请提交成功');
    } catch (error) {
      console.error('Error in POST /api/applications:', error);
      return errorResponse(error.message, 500);
    }
  }

  // PUT /api/applications/:id/review - 审核申请（教师）
  const appIdMatch = pathname.match(/^\/api\/applications\/(\d+)\/(review|approve)$/);
  if (appIdMatch && request.method === 'PUT') {
    if (!user || !roleAuth('teacher')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const appId = appIdMatch[1];
      const { status } = await request.json();
      await env.DB.prepare('UPDATE application SET status = ? WHERE id = ?').bind(status, appId).run();
      return successResponse(null, '审核成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  return null;
}
