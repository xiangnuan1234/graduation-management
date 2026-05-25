import { generateToken, successResponse, errorResponse } from '../utils.js';

// 简单的密码哈希（生产环境建议使用 bcryptjs 的 WebAssembly 版本）
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt-graduation-2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

export async function handleAuth(request, env, user) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // POST /api/auth/login
  if (pathname === '/api/auth/login' && request.method === 'POST') {
    try {
      const { username, password } = await request.json();
      
      if (!username || !password) {
        return errorResponse('用户名和密码不能为空', 400);
      }

      const result = await env.DB.prepare('SELECT * FROM user WHERE username = ?').bind(username).first();
      
      if (!result) {
        // 自动创建管理员账户
        const hashedPassword = await hashPassword('admin123');
        await env.DB.prepare(
          'INSERT INTO user (username, password, real_name, role, major, email) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(username, hashedPassword, '系统管理员', 'admin', '计算机学院', 'admin@edu.cn').run();
        
        const newUser = await env.DB.prepare('SELECT * FROM user WHERE username = ?').bind(username).first();
        const token = await generateToken(newUser);
        
        return successResponse({
          token,
          user: {
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
            real_name: newUser.real_name,
            major: newUser.major
          }
        }, '登录成功（新建账户）');
      }

      const isValid = await verifyPassword(password, result.password);
      if (!isValid) {
        return errorResponse('用户名或密码错误', 401);
      }

      const token = await generateToken(result);
      
      return successResponse({
        token,
        user: {
          id: result.id,
          username: result.username,
          role: result.role,
          real_name: result.real_name,
          major: result.major
        }
      }, '登录成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // POST /api/auth/register
  if (pathname === '/api/auth/register' && request.method === 'POST') {
    try {
      const { username, password, real_name, role, major, email } = await request.json();
      
      if (!username || !password || !real_name) {
        return errorResponse('用户名、密码和姓名不能为空', 400);
      }

      // 检查用户名是否已存在
      const existingUser = await env.DB.prepare('SELECT * FROM user WHERE username = ?').bind(username).first();
      if (existingUser) {
        return errorResponse('用户名已存在', 400);
      }

      // 默认角色为学生，除非明确指定
      const userRole = role || 'student';
      
      // 只有管理员可以创建教师和管理员账户
      if ((userRole === 'admin' || userRole === 'teacher') && (!user || user.role !== 'admin')) {
        return errorResponse('权限不足，无法创建该类型账户', 403);
      }

      const hashedPassword = await hashPassword(password);
      await env.DB.prepare(
        'INSERT INTO user (username, password, real_name, role, major, email) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(username, hashedPassword, real_name, userRole, major || null, email || null).run();
      
      return successResponse(null, '注册成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // POST /api/auth/logout
  if (pathname === '/api/auth/logout' && request.method === 'POST') {
    return successResponse(null, '登出成功');
  }

  // POST /api/auth/changePassword
  if (pathname === '/api/auth/changePassword' && request.method === 'POST') {
    if (!user) {
      return errorResponse('未登录', 401);
    }

    try {
      const { oldPassword, newPassword } = await request.json();
      
      const dbUser = await env.DB.prepare('SELECT * FROM user WHERE id = ?').bind(user.id).first();
      if (!dbUser) {
        return errorResponse('用户不存在', 404);
      }

      const isValid = await verifyPassword(oldPassword, dbUser.password);
      if (!isValid) {
        return errorResponse('原密码错误', 400);
      }

      const hashedPassword = await hashPassword(newPassword);
      await env.DB.prepare('UPDATE user SET password = ? WHERE id = ?').bind(hashedPassword, user.id).run();
      
      return successResponse(null, '密码修改成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  return null;
}
