import { verifyToken } from './utils.js';

export async function authMiddleware(request, env) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    const user = await verifyToken(token);
    return user;
  } catch (error) {
    return null;
  }
}

export function roleAuth(...roles) {
  return (user) => {
    if (!user || !roles.includes(user.role)) {
      return false;
    }
    return true;
  };
}
