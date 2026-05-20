import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET_TEXT = 'graduation-management-secret-2024';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_TEXT);

export async function generateToken(user) {
  const token = await new SignJWT({
    id: user.id,
    username: user.username,
    role: user.role,
    real_name: user.real_name
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
  
  return token;
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export function errorResponse(message, status = 500) {
  return jsonResponse({ code: status, message }, status);
}

export function successResponse(data = null, message = '成功') {
  return jsonResponse({ code: 200, message, data });
}
