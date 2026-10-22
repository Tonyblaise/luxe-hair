import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/session";

// Server components can't clear cookies, so an expired or suspended session is sent here.
export function GET(request: NextRequest) {
  const reason = request.nextUrl.searchParams.get("reason");
  const target = new URL("/login", request.url);
  if (reason === "suspended") target.searchParams.set("reason", reason);
  const response = NextResponse.redirect(target);
  response.cookies.delete(TOKEN_COOKIE);
  return response;
}
