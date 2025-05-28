import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const pathname = request.nextUrl.pathname

  console.log('🔍 Middleware running on:', pathname)

  // Define public routes that don't need authentication
  const publicRoutes = [
    '/',
    '/auth/login', 
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/.well-known',
    '/images',
    '/favicon.ico',
    '/_next'
  ]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute) {
    console.log('✅ Public route detected:', pathname)
    return res
  }

  // For protected routes, check authentication
  console.log('🔒 Protected route detected:', pathname)
  
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()

  console.log('🔑 Session check result:', !!session)

  if (!session) {
    console.log('❌ No session, redirecting to login')
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  console.log('✅ Session valid, allowing access')
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}