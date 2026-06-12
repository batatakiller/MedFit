import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/cadastro",
  "/recuperar-senha",
  "/confirmar-email",
  "/termos",
  "/privacidade",
  "/auth/callback",
  "/verificar-2fa",
];

const AUTH_PAGES = ["/login", "/cadastro", "/recuperar-senha"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/api/public") ||
    /\.(svg|png|jpg|jpeg|webp|ico|js|css|json|txt|woff2?)$/.test(pathname)
  );
}

// Atualiza a sessão (refresh de token) e aplica o controle de rotas:
// - não autenticado em rota privada  → redireciona para /login
// - autenticado em página de auth    → redireciona para /dashboard
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() valida o JWT no servidor do Supabase (não confiar só no cookie)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 2FA: usuário com fator TOTP verificado precisa elevar a sessão para AAL2
  // antes de acessar rotas privadas (evita pular o desafio navegando direto).
  if (user) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const needsMfa = aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2";

    if (needsMfa && !isPublic(pathname)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "verificação 2FA necessária" }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/verificar-2fa";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (!needsMfa && pathname === "/verificar-2fa") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (AUTH_PAGES.includes(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = needsMfa ? "/verificar-2fa" : "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
