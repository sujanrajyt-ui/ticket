import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const username = (body.username || body.email || "").trim().toLowerCase();
        const password = (body.password || "").trim();

        if (!username || !password) {
            return NextResponse.json({ error: "Username and password required" }, { status: 400 });
        }

        // Standardize input
        let normalizedEmail = username;
        let role = "admin";

        if (username === "admin" || username === "admin@nitte.edu.in") {
            normalizedEmail = "admin@nitte.edu.in";
            role = "admin";
        } else if (username === "volunteer" || username === "volunteer@nitte.edu.in") {
            normalizedEmail = "volunteer@nitte.edu.in";
            role = "volunteer";
        }

        // Primary: Check hardcoded credentials for instant organizer access
        const isValidAdmin = (username === "admin" || username === "admin@nitte.edu.in") && password === "Vista123@";
        const isValidVolunteer = (username === "volunteer" || username === "volunteer@nitte.edu.in") && password === "Vista123@";

        let authenticated = isValidAdmin || isValidVolunteer;

        // Secondary: Try Supabase auth sign-in if not hardcoded match
        if (!authenticated) {
            try {
                const supabase = await createAdminClient();
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: normalizedEmail,
                    password,
                });
                if (!error && data.user) {
                    authenticated = true;
                }
            } catch { /* ignore fallback */ }
        }

        if (!authenticated) {
            return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
        }

        // Create response with admin_session cookie
        const response = NextResponse.json({
            success: true,
            role,
            username,
            redirect: "/admin",
        });

        // Set secure session cookie valid for 7 days
        response.cookies.set("admin_session", JSON.stringify({ role, username, loggedInAt: Date.now() }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch {
        return NextResponse.json({ error: "Authentication server error" }, { status: 500 });
    }
}
