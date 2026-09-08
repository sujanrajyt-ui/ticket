import { NextRequest, NextResponse } from "next/server";
import { getAttendees } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const filter = searchParams.get("filter") || "all";

        const { attendees, total } = await getAttendees(search, filter);

        return NextResponse.json({ attendees, total });
    } catch (err) {
        console.error("Attendees API error:", err);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
