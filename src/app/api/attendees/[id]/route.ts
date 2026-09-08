import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Attendee } from "@/types/database";
import { deleteAttendee } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const adminClient = await createAdminClient();
        const { data: rawData, error } = await adminClient
            .from("attendees")
            .select("*")
            .or(`registration_id.eq.${id},id.eq.${id},qr_token.eq.${id}`)
            .maybeSingle();

        const data = rawData as unknown as Attendee | null;

        if (error || !data) {
            return NextResponse.json({ error: "Attendee not found." }, { status: 404 });
        }

        return NextResponse.json({ attendee: data });
    } catch {
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await deleteAttendee(id);

        if (!result.success) {
            return NextResponse.json({ error: result.error || "Failed to delete attendee." }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: "Attendee registration deleted successfully." });
    } catch {
        return NextResponse.json({ error: "Internal server error during deletion." }, { status: 500 });
    }
}
