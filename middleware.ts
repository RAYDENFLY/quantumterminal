import { NextResponse, type NextRequest } from 'next/server';

// Basic route protection for upcoming community features.
// We only check cookie presence here (fast). Server-side API still validates session in DB.
const PROTECTED_PREFIXES = ['/community', '/watchlist'];
const COOKIE_NAME = 'qt_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/community/:path*', '/watchlist/:path*'],
};
