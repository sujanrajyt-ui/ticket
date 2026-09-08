import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Attendee, Profile } from "@/types/database";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: rawProfile } = await supabase
            .from("profiles").select("role").eq("id", user.id).single();
        const profile = rawProfile as unknown as Profile | null;
        if (!profile || profile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const adminClient = await createAdminClient();
        const { data: rawData, error } = await adminClient
            .from("attendees")
            .select("*")
            .eq("registration_id", id)
            .single();

        const data = rawData as unknown as Attendee | null;

        if (error || !data) {
            return NextResponse.json({ error: "Attendee not found." }, { status: 404 });
        }

        return NextResponse.json({ attendee: data });
    } catch {
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
