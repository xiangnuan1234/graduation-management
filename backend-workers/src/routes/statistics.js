import { successResponse, errorResponse } from '../utils.js';
import { roleAuth } from '../middleware.js';

export async function handleStatistics(request, env, user) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /api/statistics/overview - 获取概览统计
  if (pathname === '/api/statistics/overview' && request.method === 'GET') {
    if (!user) {
      return errorResponse('未登录', 401);
    }

    try {
      const studentCount = await env.DB.prepare("SELECT COUNT(*) as count FROM user WHERE role = 'student'").first();
      const teacherCount = await env.DB.prepare("SELECT COUNT(*) as count FROM user WHERE role = 'teacher'").first();
      const openTopics = await env.DB.prepare("SELECT COUNT(*) as count FROM topic WHERE status = 'open'").first();
      const selectedStudents = await env.DB.prepare("SELECT COUNT(DISTINCT student_id) as count FROM application WHERE status = 'pass'").first();

      return successResponse({
        users: {
          student: studentCount.count,
          teacher: teacherCount.count
        },
        openTopics: openTopics.count,
        selectedStudents: selectedStudents.count
      });
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // GET /api/statistics/topics - 课题统计
  if (pathname === '/api/statistics/topics' && request.method === 'GET') {
    if (!user) {
      return errorResponse('未登录', 401);
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
    if (!user) {
      return errorResponse('未登录', 401);
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

  // GET /api/statistics/topics/popularity - 课题热度统计
  if (pathname === '/api/statistics/topics/popularity' && request.method === 'GET') {
    if (!user) {
      return errorResponse('未登录', 401);
    }

    try {
      const { results } = await env.DB.prepare(`
        SELECT t.id, t.title, u.real_name as teacher_name, COUNT(a.id) as application_count
        FROM topic t
        LEFT JOIN user u ON t.teacher_id = u.id
        LEFT JOIN application a ON t.id = a.topic_id
        GROUP BY t.id, t.title, u.real_name
        ORDER BY application_count DESC
        LIMIT 10
      `).all();

      return successResponse(results);
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // GET /api/statistics/teachers/stats - 导师指导学生数统计
  if (pathname === '/api/statistics/teachers/stats' && request.method === 'GET') {
    if (!user) {
      return errorResponse('未登录', 401);
    }

    try {
      const { results } = await env.DB.prepare(`
        SELECT u.id, u.real_name, COUNT(a.id) as student_count
        FROM user u
        LEFT JOIN topic t ON u.id = t.teacher_id
        LEFT JOIN application a ON t.id = a.topic_id AND a.status = 'pass'
        WHERE u.role = 'teacher'
        GROUP BY u.id, u.real_name
        ORDER BY student_count DESC
      `).all();

      return successResponse(results);
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // GET /api/statistics/scores - 成绩分布统计
  if (pathname === '/api/statistics/scores' && request.method === 'GET') {
    if (!user) {
      return errorResponse('未登录', 401);
    }

    try {
      const { results: proposalResults } = await env.DB.prepare(`
        SELECT score FROM proposal WHERE score IS NOT NULL
      `).all();

      const proposalScores = proposalResults.map(r => r.score);

      return successResponse({
        proposalScores
      });
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  // GET /api/statistics/stages/progress - 各阶段进度统计
  if (pathname === '/api/statistics/stages/progress' && request.method === 'GET') {
    if (!user) {
      return errorResponse('未登录', 401);
    }

    try {
      const proposalSubmitted = await env.DB.prepare("SELECT COUNT(*) as count FROM proposal WHERE status = 'submitted'").first();
      const midtermSubmitted = await env.DB.prepare("SELECT COUNT(*) as count FROM midterm WHERE status = 'submitted'").first();
      const documentSubmitted = await env.DB.prepare("SELECT COUNT(*) as count FROM document").first();

      return successResponse({
        proposal: {
          submitted: proposalSubmitted.count
        },
        midterm: {
          submitted: midtermSubmitted.count
        },
        document: {
          submitted: documentSubmitted.count
        }
      });
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  return null;
}
