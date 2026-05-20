import { handleAuth } from './routes/auth';
import { handleUsers } from './routes/users';
import { handleTopics } from './routes/topics';
import { handleApplications } from './routes/applications';
import { handleProposals } from './routes/proposals';
import { handleMidterms } from './routes/midterms';
import { handleDocuments } from './routes/documents';
import { handleNotifications } from './routes/notifications';
import { handleStatistics } from './routes/statistics';
import { authMiddleware, roleAuth } from './middleware';
import { errorResponse, successResponse } from './utils';

export default {
  async fetch(request, env, ctx) {
    // CORS 预检请求
    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('Origin');
      const allowedOrigins = [
        'https://www.xiangnuan.cc.cd',
        'https://xiangnuan.cc.cd',
        'https://graduation-management.pages.dev',
        env.FRONTEND_URL
      ].filter(Boolean);
      
      const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
      
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': allowOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // 认证用户
    let user = null;
    if (!pathname.startsWith('/api/auth/login')) {
      user = await authMiddleware(request, env);
    }

    // 路由处理
    let response = null;

    // 认证路由
    if (pathname.startsWith('/api/auth/')) {
      response = await handleAuth(request, env, user);
    }
    // 用户路由
    else if (pathname.startsWith('/api/users')) {
      response = await handleUsers(request, env, user);
    }
    // 课题路由
    else if (pathname.startsWith('/api/topics')) {
      response = await handleTopics(request, env, user);
    }
    // 申请路由
    else if (pathname.startsWith('/api/applications')) {
      response = await handleApplications(request, env, user);
    }
    // 开题报告路由
    else if (pathname.startsWith('/api/proposals')) {
      response = await handleProposals(request, env, user);
    }
    // 中期检查路由
    else if (pathname.startsWith('/api/midterms')) {
      response = await handleMidterms(request, env, user);
    }
    // 文档路由
    else if (pathname.startsWith('/api/documents')) {
      response = await handleDocuments(request, env, user);
    }
    // 通知路由
    else if (pathname.startsWith('/api/notifications')) {
      response = await handleNotifications(request, env, user);
    }
    // 统计路由
    else if (pathname.startsWith('/api/statistics')) {
      response = await handleStatistics(request, env, user);
    }
    // 文件访问路由（需要 R2 配置）
    else if (pathname.startsWith('/files/')) {
      if (!env.FILES) {
        return errorResponse('文件存储功能未配置', 503);
      }
      
      const key = pathname.replace('/files/', '');
      const object = await env.FILES.get(key);
      
      if (object === null) {
        return errorResponse('File not found', 404);
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Access-Control-Allow-Origin', origin || env.FRONTEND_URL || '*');

      return new Response(object.body, {
        headers,
      });
    }

    if (response) {
      return response;
    }

    return errorResponse('Not Found', 404);
  }
};
