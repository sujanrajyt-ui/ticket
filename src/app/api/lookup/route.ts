import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Profile } from "@/types/database";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: rawProfile } = await supabase
            .from("profiles").select("role").eq("id", user.id).single();
        const profile = rawProfile as unknown as Profile | null;
        if (!profile || !["admin", "volunteer"].includes(profile.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ error: "Token required" }, { status: 400 });
        }

        const adminClient = await createAdminClient();
        const { data: rawData, error } = await adminClient
            .from("attendees")
            .select("first_name, last_name, usn, registration_id, checked_in, checked_in_at")
            .eq("qr_token", token)
            .single();

        const data = rawData as unknown as {
            first_name: string;
            last_name: string;
            usn: string;
            registration_id: string;
            checked_in: boolean;
            checked_in_at: string | null;
        } | null;

        if (error || !data) {
            return NextResponse.json({ found: false });
        }

        return NextResponse.json({
            found: true,
            name: `${data.first_name} ${data.last_name}`,
            usn: data.usn,
            registration_id: data.registration_id,
            checked_in: data.checked_in,
            checked_in_at: data.checked_in_at,
        });
    } catch {
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
