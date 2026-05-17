import { NextResponse, type NextRequest } from "next/server";

function buildContentSecurityPolicy() {
  const isDev = process.env.NODE_ENV === "development";
  const scriptSources = ["'self'", isDev ? "'unsafe-eval'" : "", "'unsafe-inline'"].filter(Boolean).join(" ");
  const connectSources = [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    isDev ? "http://localhost:*" : "",
    isDev ? "ws://localhost:*" : "",
    isDev ? "http://127.0.0.1:*" : "",
    isDev ? "ws://127.0.0.1:*" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    `connect-src ${connectSources}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];

  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export function proxy(request: NextRequest) {
  void request;
  const response = NextResponse.next();

  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy());
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|planillas-icon-192.png|planillas-icon-512.png|apple-touch-icon.png).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" }
      ]
    }
  ]
};
