import { NextResponse } from "next/server";
import { getTieBreakerVoteStatus, castTieBreakerVote } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ error: "Ticket token or ID required" }, { status: 400 });
        }

        const status = await getTieBreakerVoteStatus(token);
        return NextResponse.json(status);
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to fetch poll status" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, candidate_id } = body;

        if (!token || !candidate_id) {
            return NextResponse.json(
                { error: "Ticket token and candidate selection required" },
                { status: 400 }
            );
        }

        const result = await castTieBreakerVote(token, candidate_id);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        const updatedStatus = await getTieBreakerVoteStatus(token);
        return NextResponse.json({ success: true, ...updatedStatus });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to submit vote" },
            { status: 500 }
        );
    }
}
