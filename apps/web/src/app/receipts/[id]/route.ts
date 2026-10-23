import { NextResponse, type NextRequest } from "next/server";
import { apiFetch, apiUrl } from "@/lib/api";
import { getToken } from "@/lib/session";
const UUID = /^[0-9a-f-]{36}$/i;

// The browser never holds the API token, so receipt images (stored in R2) are served through here.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getToken();
  if (!token) return NextResponse.redirect(new URL("/login", request.url));
  if (!UUID.test(id)) return new NextResponse("Not found", { status: 404 });

  const res = await apiFetch(apiUrl(`/expenses/${id}/receipt`), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return new NextResponse("Not found", { status: res.status === 401 ? 401 : 404 });
  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
