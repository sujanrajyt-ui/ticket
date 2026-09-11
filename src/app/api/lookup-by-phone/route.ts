import { NextRequest, NextResponse } from "next/server";
import { lookupAttendeeByPhone } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const phone = (body.phone || "").trim().replace(/\D/g, "");

        if (!phone || phone.length !== 10) {
            return NextResponse.json(
                { error: "Please enter a valid 10-digit mobile number." },
                { status: 400 }
            );
        }

        const attendee = await lookupAttendeeByPhone(phone);

        if (!attendee) {
            return NextResponse.json(
                { error: "No registration found for this mobile number." },
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
            { error: "Lookup failed. Please check your mobile number and try again." },
            { status: 500 }
        );
    }
}
