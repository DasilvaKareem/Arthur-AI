import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales } from './app/locales'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Check if the pathname has a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  
  // Only localize specific pages: homepage, pricing, features, and contact
  const shouldLocalize = 
    pathname === '/' ||
    pathname === '/pricing' ||
    pathname === '/features' ||
    pathname === '/contact';
  
  // If it doesn't have a locale and should be localized, redirect to the default locale
  if (!pathnameHasLocale && shouldLocalize) {
    // Redirect to the default locale (en)
    return NextResponse.redirect(
      new URL(`/en${pathname}`, request.url)
    )
  }
  
  return NextResponse.next()
}

export const config = {
  // Match all paths except for:
  // - API routes
  // - Static files (images, etc.)
  // - _next (Next.js internal paths)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
} 