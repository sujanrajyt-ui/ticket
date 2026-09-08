import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
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
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
    const isLoginPage = request.nextUrl.pathname === "/admin/login";

    if (isAdminRoute && !isLoginPage && !user) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/admin/login";
        redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
    }

    if (isLoginPage && user) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/admin";
        return NextResponse.redirect(redirectUrl);
    }

    return supabaseResponse;
}
