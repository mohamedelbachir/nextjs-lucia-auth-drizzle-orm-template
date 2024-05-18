import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionForMiddleware } from "./lib/auth/utils";
import createIntlMiddleware from "next-intl/middleware";
import { localePrefix, locales, pathnames } from "./navigation";

const AuthRoutes = "/auth";
const ProtectedRoutes = ["/protected"];

/* 
  With mySql need to remove the auth logic from the middleware
  instead use the validateRequest function in the layout or in pages.
  This is because we need to call the database to validate the session
  and we can't call it with mysql2 because of edge incompatibility.
*/

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  // Step 1: Use the incoming request (example)
  const defaultLocale = (request.headers.get("x-your-custom-locale") ||
    "en") as "fr" | "en";
  // Step 2: Create and call the next-intl middleware (example)
  const handleI18nRouting = createIntlMiddleware({
    locales,
    defaultLocale,
    pathnames:pathnames,
    localePrefix: localePrefix
  });
  const response = handleI18nRouting(request);

  const sessionId = cookies().get("auth_session")?.value ?? null;
  const { user } = await getSessionForMiddleware(sessionId);

  const isAuthRoute = nextUrl.pathname.startsWith(AuthRoutes);
  const isProtectedRoute = ProtectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // Redirect to /protected if user is logged in and tries to access auth routes
  if (user && isAuthRoute) {
    const url = new URL("/protected", nextUrl.origin);
    return NextResponse.redirect(url);
  }

  // Redirect to /auth/login if user is not logged in and tries to access protected routes
  if (!user && isProtectedRoute) {    
    const url = new URL("/auth/login", nextUrl.origin);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/', '/(en|fr)/:path*', '/((?!api|_next|.*\\..*).*)'],
};
