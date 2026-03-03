import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

// Array de rotas públicas que não exigem token
const publicRoutes = ['/api/auth/login', '/api/auth/register']

// Mapeamento de prefixos de rotas para roles exigidas (RBAC Base)
const roleProtectedRoutes = {
    '/api/v1/admin': ['ADMIN'],
    '/admin': ['ADMIN'],
}

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Permitir rotas públicas
    if (publicRoutes.includes(path)) {
        return NextResponse.next()
    }

    // Verifica proteção básica
    const isApiRoute = path.startsWith('/api/')
    const isDashboardRoute = path.startsWith('/admin') || path.startsWith('/client')

    if (isApiRoute || isDashboardRoute) {
        const token = request.cookies.get('accessToken')?.value

        if (!token) {
            if (isApiRoute) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const payload = await verifyToken(token)

        if (!payload) {
            if (isApiRoute) {
                return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
            }
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // RBAC check
        for (const [routePrefix, allowedRoles] of Object.entries(roleProtectedRoutes)) {
            if (path.startsWith(routePrefix)) {
                if (!allowedRoles.includes(payload.role)) {
                    if (isApiRoute) {
                        return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 })
                    }
                    return NextResponse.redirect(new URL('/unauthorized', request.url))
                }
            }
        }

        // Injetar user id e role no header para os controllers subsequentes usarem
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-user-id', payload.id)
        requestHeaders.set('x-user-role', payload.role)

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        })
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/api/:path*', '/admin/:path*', '/client/:path*'],
}
