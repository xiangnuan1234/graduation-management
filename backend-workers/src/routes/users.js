import { successResponse, errorResponse } from '../utils.js';
import { roleAuth } from '../middleware.js';

export async function handleUsers(request, env, user) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /api/users - 获取用户列表（需要管理员权限）
  if (pathname === '/api/users' && request.method === 'GET') {
    if (!user || !roleAuth('admin')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const { page = 1, pageSize = 10, role, major } = Object.fromEntries(url.searchParams);
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      
      let sql = 'SELECT id, username, real_name, role, major, email, created_at FROM user';
      let countSql = 'SELECT COUNT(*) as total FROM user';
      const conditions = [];
      const bindings = [];
      
      if (role) {
        conditions.push('role = ?');
        bindings.push(role);
      }
      if (major) {
        conditions.push('major LIKE ?');
        bindings.push(`%${major}%`);
      }
      
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
        countSql += ' WHERE ' + conditions.join(' AND ');
      }
      
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      bindings.push(parseInt(pageSize), offset);
      
      const { results } = await env.DB.prepare(sql).bind(...bindings).all();
      const { total } = await env.DB.prepare(countSql).bind(...bindings.slice(0, -2)).first();
      
      return successResponse({ list: results, total });
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // POST /api/users - 创建用户（需要管理员权限）
  if (pathname === '/api/users' && request.method === 'POST') {
    if (!user || !roleAuth('admin')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const { username, password, real_name, role, major, email } = await request.json();
      
      // 简单密码哈希
      const encoder = new TextEncoder();
      const data = encoder.encode(password + 'salt-graduation-2024');
      const hash = await crypto.subtle.digest('SHA-256', data);
      const hashedPassword = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

      await env.DB.prepare(
        'INSERT INTO user (username, password, real_name, role, major, email) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(username, hashedPassword, real_name, role, major, email).run();

      return successResponse(null, '用户创建成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // GET /api/users/profile - 获取当前用户信息
  if (pathname === '/api/users/profile' && request.method === 'GET') {
    if (!user) {
      return errorResponse('未登录', 401);
    }

    try {
      const dbUser = await env.DB.prepare('SELECT id, username, real_name, role, major, email FROM user WHERE id = ?').bind(user.id).first();
      return successResponse(dbUser);
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // PUT /api/users/profile - 更新用户信息
  if (pathname === '/api/users/profile' && request.method === 'PUT') {
    if (!user) {
      return errorResponse('未登录', 401);
    }

    try {
      const { real_name, major, email } = await request.json();
      await env.DB.prepare(
        'UPDATE user SET real_name = ?, major = ?, email = ? WHERE id = ?'
      ).bind(real_name, major, email, user.id).run();

      return successResponse(null, '更新成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // PUT /api/users/:id - 更新用户（需要管理员权限）
  const userIdMatch = pathname.match(/^\/api\/users\/(\d+)$/);
  if (userIdMatch && request.method === 'PUT') {
    if (!user || !roleAuth('admin')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const userId = userIdMatch[1];
      const { real_name, role, major, email } = await request.json();
      await env.DB.prepare(
        'UPDATE user SET real_name = ?, role = ?, major = ?, email = ? WHERE id = ?'
      ).bind(real_name, role, major, email, userId).run();
      return successResponse(null, '更新成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // POST /api/users/:id/reset-password - 重置密码（需要管理员权限）
  const resetPasswordMatch = pathname.match(/^\/api\/users\/(\d+)\/reset-password$/);
  if (resetPasswordMatch && request.method === 'POST') {
    if (!user || !roleAuth('admin')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const userId = resetPasswordMatch[1];
      const newPassword = '123456';
      const encoder = new TextEncoder();
      const data = encoder.encode(newPassword + 'salt-graduation-2024');
      const hash = await crypto.subtle.digest('SHA-256', data);
      const hashedPassword = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      await env.DB.prepare('UPDATE user SET password = ? WHERE id = ?').bind(hashedPassword, userId).run();
      return successResponse(null, '密码已重置为123456');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // DELETE /api/users/:id - 删除用户（需要管理员权限）
  if (userIdMatch && request.method === 'DELETE') {
    if (!user || !roleAuth('admin')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const userId = userIdMatch[1];
      await env.DB.prepare('DELETE FROM user WHERE id = ?').bind(userId).run();
      return successResponse(null, '删除成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  return null;
}
