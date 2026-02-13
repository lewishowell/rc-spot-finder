import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // Middleware logic can be added here if needed
  // For now, we handle auth checks in individual API routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip static files and api/auth routes
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
