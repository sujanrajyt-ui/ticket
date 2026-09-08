import { NextRequest, NextResponse } from "next/server";
import { lookupAttendee, deleteAttendee } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const attendee = await lookupAttendee(id);

        if (!attendee) {
            return NextResponse.json({ error: "Attendee not found." }, { status: 404 });
        }

        return NextResponse.json({ attendee });
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
