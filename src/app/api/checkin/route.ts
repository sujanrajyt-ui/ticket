import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        // Verify authenticated user (admin or volunteer)
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check role
        const { data: rawProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        const profile = rawProfile as unknown as { role: string } | null;

        if (!profile || !["admin", "volunteer"].includes(profile.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { token } = await request.json();

        if (!token || typeof token !== "string") {
            return NextResponse.json({ error: "Token required" }, { status: 400 });
        }

        // Call atomic check-in function
        const adminClient = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (adminClient as any).rpc("check_in_attendee", {
            p_token: token,
        });

        if (error) {
            console.error("Check-in RPC error:", error);
            return NextResponse.json(
                { error: "Check-in failed. Please try again." },
                { status: 500 }
            );
        }

        const result = data?.[0];
        if (!result) {
            return NextResponse.json(
                { error: "Unexpected error." },
                { status: 500 }
            );
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error("Check-in API error:", err);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
