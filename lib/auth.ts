import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
}

export class AuthService {
  private static SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

  static generateToken(user: AdminUser): string {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      }, 
      this.SECRET, 
      { expiresIn: '7d' }
    );
  }

  static verifyToken(token: string): AdminUser | null {
    try {
      const decoded = jwt.verify(token, this.SECRET) as any;
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      return null;
    }
  }

  static async validateAdmin(email: string, password: string): Promise<AdminUser | null> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@quantumterminal.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'quantum2026!';

    if (email === adminEmail && password === adminPassword) {
      return {
        id: 'admin-1',
        email: adminEmail,
        role: 'admin'
      };
    }

    return null;
  }

  static extractTokenFromRequest(request: NextRequest): string | null {
    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookies
    const cookieToken = request.cookies.get('auth-token');
    if (cookieToken) {
      return cookieToken.value;
    }

    return null;
  }

  static async requireAdmin(request: NextRequest): Promise<AdminUser | null> {
    const token = this.extractTokenFromRequest(request);
    if (!token) {
      return null;
    }

    const user = this.verifyToken(token);
    if (!user || user.role !== 'admin') {
      return null;
    }

    return user;
  }
}

// Middleware helper
export function withAuth(handler: (req: NextRequest, user: AdminUser) => Promise<Response>) {
  return async (req: NextRequest) => {
    const user = await AuthService.requireAdmin(req);
    
    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized. Admin access required.' 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(req, user);
  };
}
