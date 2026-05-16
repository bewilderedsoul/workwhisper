// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;
        // Protected routes
        const protectedPaths = ["/profile", "/post/new"];
        const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
        if (isProtected) return !!token;
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/profile/:path*", "/post/new/:path*"],
};
