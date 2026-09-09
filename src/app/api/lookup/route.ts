import { NextRequest, NextResponse } from "next/server";
import { lookupAttendee } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ error: "Token required" }, { status: 400 });
        }

        const attendee = await lookupAttendee(token);

        if (!attendee) {
            return NextResponse.json({ found: false });
        }

        return NextResponse.json({
            found: true,
            name: `${attendee.first_name} ${attendee.last_name}`.trim(),
            usn: attendee.usn,
            registration_id: attendee.registration_id,
            branch: attendee.branch,
            year: attendee.year,
            checked_in: attendee.checked_in,
            checked_in_at: attendee.checked_in_at,
        });
    } catch {
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
