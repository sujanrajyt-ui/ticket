import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const adminSessionRaw = cookieStore.get("admin_session")?.value;

        if (adminSessionRaw) {
            const session = JSON.parse(adminSessionRaw) as { role?: string; username?: string };
            return NextResponse.json({ role: session.role || "volunteer", username: session.username });
        }

        return NextResponse.json({ role: null });
    } catch {
        return NextResponse.json({ role: null });
    }
}
