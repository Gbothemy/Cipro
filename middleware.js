import { NextResponse } from 'next/server';
import { verifySessionToken } from './lib/session';

const PUBLIC_ROUTES = ['/', '/login', '/admin/login', '/privacy', '/terms', '/support', '/about', '/faq'];
const ADMIN_ROUTES = ['/admin'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public routes and static files
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check auth from cookie (set on login)
  const authCookie = request.cookies.get('cipro-auth');

  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const auth = await verifySessionToken(authCookie.value);
    if (!auth) throw new Error('Invalid session');

    // Admin route protection
    if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
      if (!auth.isAdmin) {
        return NextResponse.redirect(new URL('/game', request.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
