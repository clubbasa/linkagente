import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/constants";

// Chequeo liviano: solo confirma que la cookie de sesión exista, para
// redirigir de una vez a /login y evitar parpadeos de contenido protegido.
// La verificación real (firma válida, no expirada) ocurre en el server
// component del dashboard vía Firebase Admin, que es donde de verdad
// importa que sea a prueba de manipulación.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/distributor") ||
    request.nextUrl.pathname.startsWith("/superadmin");

  if (!hasSession && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/distributor/:path*", "/superadmin/:path*"],
};
