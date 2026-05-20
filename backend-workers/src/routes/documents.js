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

      // 检查 R2 是否配置
      if (!env.FILES) {
        return errorResponse('文件存储功能未配置，请联系管理员启用 R2', 503);
      }

      // 生成唯一文件名
      const uuid = crypto.randomUUID();
      const ext = file.name.split('.').pop();
      const key = `documents/${uuid}.${ext}`;

      // 上传到 R2
      await env.FILES.put(key, file.stream(), {
        httpMetadata: { contentType: file.type }
      });

      // 获取当前版本
      const versionResult = await env.DB.prepare(
        'SELECT MAX(version) as max_version FROM document WHERE student_id = ?'
      ).bind(user.id).first();
      
      const version = (versionResult?.max_version || 0) + 1;

      // 保存记录到数据库
      await env.DB.prepare(
        'INSERT INTO document (student_id, version, file_path, file_name, status) VALUES (?, ?, ?, ?, ?)'
      ).bind(user.id, version, key, file.name, 'submitted').run();

      return successResponse(null, '上传成功');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  return null;
}
