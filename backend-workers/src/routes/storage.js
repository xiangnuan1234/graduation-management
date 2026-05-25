import { successResponse, errorResponse } from '../utils.js';
import { roleAuth } from '../middleware.js';
import { getR2UsageStats } from '../utils/r2-monitor.js';

export async function handleStorage(request, env, user) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /api/storage/usage - 获取 R2 使用统计（所有登录用户）
  if (pathname === '/api/storage/usage' && request.method === 'GET') {
    if (!user) {
      return errorResponse('请先登录', 401);
    }

    try {
      const stats = await getR2UsageStats(env);
      return successResponse(stats);
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return errorResponse(error.message, 500);
    }
  }

  // POST /api/storage/cleanup - 清理过期文件（仅管理员）
  if (pathname === '/api/storage/cleanup' && request.method === 'POST') {
    if (!user || !roleAuth('admin')(user)) {
      return errorResponse('权限不足，需要管理员权限', 403);
    }

    try {
      if (!env.FILES) {
        return errorResponse('R2 存储未配置', 503);
      }

      // 这里可以实现清理逻辑，例如删除超过一定时间的文件
      // 目前返回提示信息
      return successResponse(null, '清理功能待实现');
    } catch (error) {
      console.error('Error cleaning up storage:', error);
      return errorResponse(error.message, 500);
    }
  }

  return null;
}
