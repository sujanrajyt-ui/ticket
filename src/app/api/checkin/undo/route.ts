import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Profile } from "@/types/database";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Admin only
        const { data: rawProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        const profile = rawProfile as unknown as Profile | null;

        if (!profile || profile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { registration_id } = await request.json();

        if (!registration_id) {
            return NextResponse.json(
                { error: "registration_id required" },
                { status: 400 }
            );
        }

        const adminClient = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (adminClient.from("attendees") as any)
            .update({ checked_in: false, checked_in_at: null })
            .eq("registration_id", registration_id);

        if (error) {
            return NextResponse.json(
                { error: "Failed to undo check-in." },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Undo check-in error:", err);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
