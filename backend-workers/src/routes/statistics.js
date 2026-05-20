import { successResponse, errorResponse } from '../utils.js';
import { roleAuth } from '../middleware.js';

export async function handleStatistics(request, env, user) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /api/statistics/overview - 获取概览统计
  if (pathname === '/api/statistics/overview' && request.method === 'GET') {
    if (!user || !roleAuth('admin')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM user').first();
      const topicCount = await env.DB.prepare('SELECT COUNT(*) as count FROM topic').first();
      const applicationCount = await env.DB.prepare('SELECT COUNT(*) as count FROM application').first();
      const proposalCount = await env.DB.prepare('SELECT COUNT(*) as count FROM proposal').first();

      return successResponse({
        users: userCount.count,
        topics: topicCount.count,
        applications: applicationCount.count,
        proposals: proposalCount.count
      });
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // GET /api/statistics/topics - 课题统计
  if (pathname === '/api/statistics/topics' && request.method === 'GET') {
    if (!user || !roleAuth('admin')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const { results } = await env.DB.prepare(`
        SELECT t.status, COUNT(*) as count 
        FROM topic t 
        GROUP BY t.status
      `).all();

      return successResponse(results);
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // GET /api/statistics/applications - 申请统计
  if (pathname === '/api/statistics/applications' && request.method === 'GET') {
    if (!user || !roleAuth('admin')(user)) {
      return errorResponse('权限不足', 403);
    }

    try {
      const { results } = await env.DB.prepare(`
        SELECT a.status, COUNT(*) as count 
        FROM application a 
        GROUP BY a.status
      `).all();

      return successResponse(results);
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  return null;
}
