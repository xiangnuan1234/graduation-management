import { successResponse, errorResponse } from '../utils.js';

export async function handleNotifications(request, env, user) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /api/notifications - 获取通知列表
  if (pathname === '/api/notifications' && request.method === 'GET') {
    if (!user) {
      return errorResponse('未登录', 401);
    }

    try {
      const { results } = await env.DB.prepare(
        'SELECT * FROM notification WHERE user_id = ? ORDER BY created_at DESC'
      ).bind(user.id).all();
      
      const unreadCount = results.filter(n => !n.is_read).length;
      
      return successResponse({
        list: results,
        unreadCount
      });
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // POST /api/notifications - 创建通知（管理员或教师）
  if (pathname === '/api/notifications' && request.method === 'POST') {
    if (!user || !['admin', 'teacher'].includes(user.role)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const { user_id, title, content } = await request.json();
      await env.DB.prepare(
        'INSERT INTO notification (user_id, title, content) VALUES (?, ?, ?)'
      ).bind(user_id, title, content).run();

      return successResponse(null, '通知发送成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // POST /api/notifications/broadcast - 广播通知（仅管理员）
  if (pathname === '/api/notifications/broadcast' && request.method === 'POST') {
    if (!user || user.role !== 'admin') {
      return errorResponse('权限不足', 403);
    }

    try {
      const { title, content, role } = await request.json();
      
      // 获取目标用户列表
      let users;
      if (role) {
        const result = await env.DB.prepare(
          'SELECT id FROM user WHERE role = ?'
        ).bind(role).all();
        users = result.results;
      } else {
        const result = await env.DB.prepare(
          'SELECT id FROM user'
        ).all();
        users = result.results;
      }

      // 为每个用户创建通知
      let sent = 0;
      for (const u of users) {
        await env.DB.prepare(
          'INSERT INTO notification (user_id, title, content) VALUES (?, ?, ?)'
        ).bind(u.id, title, content).run();
        sent++;
      }

      return successResponse(null, `成功发送给${sent}个用户`);
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // PUT /api/notifications/:id/read - 标记为已读
  const notifIdMatch = pathname.match(/^\/api\/notifications\/(\d+)\/read$/);
  if (notifIdMatch && request.method === 'PUT') {
    if (!user) {
      return errorResponse('未登录', 401);
    }

    try {
      const notifId = notifIdMatch[1];
      await env.DB.prepare(
        'UPDATE notification SET is_read = TRUE WHERE id = ? AND user_id = ?'
      ).bind(notifId, user.id).run();

      return successResponse(null, '已标记为已读');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // PUT /api/notifications/readAll - 全部标记为已读
  if (pathname === '/api/notifications/readAll' && request.method === 'PUT') {
    if (!user) {
      return errorResponse('未登录', 401);
    }

    try {
      await env.DB.prepare(
        'UPDATE notification SET is_read = TRUE WHERE user_id = ?'
      ).bind(user.id).run();

      return successResponse(null, '已全部标记为已读');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  return null;
}
