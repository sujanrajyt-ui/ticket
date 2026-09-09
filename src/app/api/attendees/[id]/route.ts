import { NextRequest, NextResponse } from "next/server";
import { lookupAttendee, deleteAttendee } from "@/lib/db";
import { cookies } from "next/headers";

async function requireAdmin() {
    const cookieStore = await cookies();
    const adminSessionRaw = cookieStore.get("admin_session")?.value;
    if (adminSessionRaw) {
        try {
            const session = JSON.parse(adminSessionRaw) as { role?: string };
            if (session.role === "admin") return true;
        } catch { /* ignore */ }
    }
    return false;
}

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
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
