import { NextResponse } from "next/server";
import {
    getTieBreakerPoll,
    createOrUpdateTieBreakerPoll,
    closeTieBreakerPoll,
    getAttendees,
} from "@/lib/db";

export async function GET() {
    try {
        const pollData = await getTieBreakerPoll();
        const { attendees } = await getAttendees("", "checked_in");

        // Format checked-in attendees so Admin can pick from them
        const checkedInCandidates = attendees.map((a) => ({
            id: a.registration_id || a.id,
            name: `${a.first_name} ${a.last_name}`.trim(),
            usn: a.usn || "",
            branch: a.branch || "N/A",
            qr_token: a.qr_token,
        }));

        return NextResponse.json({
            ...pollData,
            checkedInCandidates,
        });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to fetch tie breaker poll" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, candidateIds } = body;

        const result = await createOrUpdateTieBreakerPoll(
            title || "Tie Breaker Voting Poll",
            candidateIds || []
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, poll: result.poll });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to save poll" },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    try {
        await closeTieBreakerPoll();
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to close poll" },
            { status: 500 }
        );
    }
}
