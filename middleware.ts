import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const adminSession = request.cookies.get('admin_session');

    // Protect /admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!adminSession) {
            return NextResponse.redirect(new URL('/prijava', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};
