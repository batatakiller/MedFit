import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

// Middleware: rate limiting nas APIs + sessão/proteção de rotas privadas.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rl = checkRateLimit(pathname, clientIp(request.headers));
  if (rl && !rl.allowed) {
    return NextResponse.json(
      { error: "muitas requisições — aguarde antes de tentar novamente" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfterSec),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const response = await updateSession(request);
  if (rl) {
    response.headers.set("X-RateLimit-Limit", String(rl.limit));
    response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
  }
  return response;
}

export const config = {
  matcher: [
    // tudo, exceto estáticos do Next e assets
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons/).*)",
  ],
};
