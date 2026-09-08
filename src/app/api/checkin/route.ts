import { NextRequest, NextResponse } from "next/server";
import { checkInAttendee } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token || typeof token !== "string") {
            return NextResponse.json({ error: "Token required" }, { status: 400 });
        }

        const result = await checkInAttendee(token);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: result.message,
                    attendee: result.attendee,
                },
                { status: result.message === "ALREADY_CHECKED_IN" ? 200 : 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "SUCCESS",
            attendee: result.attendee,
        });
    } catch (err) {
        console.error("Check-in API error:", err);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
