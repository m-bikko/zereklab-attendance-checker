import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const authRole = request.cookies.get('auth_role')?.value;

    // 1. Authenticated User on Login Page -> Redirect to Dashboard
    if (pathname === '/login') {
        if (authRole === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
        if (authRole === 'parent') return NextResponse.redirect(new URL('/parent', request.url));
        if (authRole === 'teacher') return NextResponse.redirect(new URL('/teacher', request.url));
        return NextResponse.next();
    }

    // 2. Admin Protection
    if (pathname.startsWith('/admin')) {
        if (authRole !== 'admin') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 3. Parent Protection
    if (pathname.startsWith('/parent')) {
        if (authRole !== 'parent') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 4. Teacher Protection
    if (pathname.startsWith('/teacher')) {
        if (authRole !== 'teacher') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 5. Root Redirect
    if (pathname === '/') {
        if (authRole === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
        if (authRole === 'parent') return NextResponse.redirect(new URL('/parent', request.url));
        if (authRole === 'teacher') return NextResponse.redirect(new URL('/teacher', request.url));
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/parent/:path*', '/teacher/:path*', '/', '/login'],
};
