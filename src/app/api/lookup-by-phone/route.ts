import { NextRequest, NextResponse } from "next/server";
import { lookupAttendee } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const query = (body.phone || body.query || body.search || "").trim();

        if (!query) {
            return NextResponse.json(
                { error: "Please enter your USN, phone number, or registration ID." },
                { status: 400 }
            );
        }

        const attendee = await lookupAttendee(query);

        if (!attendee) {
            return NextResponse.json(
                { error: "No matching registration found. Please check your USN, phone number, or Reg ID." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            qr_token: attendee.qr_token,
            registration_id: attendee.registration_id,
            name: `${attendee.first_name} ${attendee.last_name}`.trim(),
            checked_in: attendee.checked_in,
        });
    } catch {
        return NextResponse.json(
            { error: "Lookup failed. Please check your details and try again." },
            { status: 500 }
        );
    }
}
