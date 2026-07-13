import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Optimistic check only — the real, secure check happens in the DAL
// (src/lib/dal.ts) close to the data. See Next.js authentication guide.
export default auth((req) => {
  const isAuthed = !!req.auth;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard") && !isAuthed) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (pathname === "/login" && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
