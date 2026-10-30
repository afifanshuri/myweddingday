import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const updateSession = async (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        const refreshedResponse = NextResponse.next({ request });
        // Preserve earlier cookie writes and cache headers if the SDK writes more than once.
        supabaseResponse.cookies.getAll().forEach((cookie) => refreshedResponse.cookies.set(cookie));
        ["cache-control", "expires", "pragma"].forEach((name) => {
          const value = supabaseResponse.headers.get(name);
          if (value) refreshedResponse.headers.set(name, value);
        });
        supabaseResponse = refreshedResponse;
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) => supabaseResponse.headers.set(name, value));
      },
    },
  });

  // This refreshes/verifies identity only. Fresh getUser() checks authorize roles and passes.
  await supabase.auth.getClaims();
  return supabaseResponse;
};
