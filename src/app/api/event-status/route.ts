import { NextResponse } from "next/server";
import { getEventSettingsServer } from "@/lib/event-config";
import { getAttendees } from "@/lib/db";

export async function GET() {
    try {
        const settings = await getEventSettingsServer();
        const { total } = await getAttendees();
        const isClosed = settings.registrationClosed || (settings.maxTickets > 0 && total >= settings.maxTickets);

        return NextResponse.json({
            isClosed,
            registrationClosed: settings.registrationClosed,
            total,
            maxTickets: settings.maxTickets,
            date: settings.date,
            venue: settings.venue,
            time: settings.time,
        });
    } catch {
        return NextResponse.json({ isClosed: false, total: 0, maxTickets: 0 });
    }
}
