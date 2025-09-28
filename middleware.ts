import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Handle auth errors gracefully
    if (error) {
      console.error("Auth middleware error:", error);

      // If there's an auth error, treat as unauthenticated
      if (request.nextUrl.pathname.startsWith("/dashboard")) {
        const loginUrl = new URL("/login", request.url);

        loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);

        return NextResponse.redirect(loginUrl);
      }

      return response;
    }

    // Protect dashboard routes
    if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
      const loginUrl = new URL("/login", request.url);

      loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);

      return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from auth pages
    if (user && isAuthPage(request.nextUrl.pathname)) {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo");
      const redirectUrl =
        redirectTo && isValidRedirectUrl(redirectTo)
          ? new URL(redirectTo, request.url)
          : new URL("/dashboard", request.url);

      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);

    // On any error, allow the request to proceed
    return response;
  }
}

// Helper function to check if the current path is an auth page
function isAuthPage(pathname: string): boolean {
  const authPages = ["/login", "/signup", "/reset-password"];

  return authPages.some((page) => pathname.startsWith(page));
}

// Helper function to validate redirect URLs (security measure)
function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url, "http://localhost:3000");

    // Only allow relative URLs or same-origin URLs
    return parsed.pathname.startsWith("/") && !parsed.pathname.startsWith("//");
  } catch {
    return false;
  }
}

export const config = {
  matcher: [
    // Protect dashboard routes
    "/dashboard/:path*",
    // Handle auth page redirects
    "/login",
    "/signup",
    "/reset-password/:path*",
  ],
};
