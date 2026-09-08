import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Attendee, Profile } from "@/types/database";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: rawProfile } = await supabase
            .from("profiles").select("role").eq("id", user.id).single();
        const profile = rawProfile as unknown as Profile | null;
        if (!profile || profile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const adminClient = await createAdminClient();
        const { data: rawData, error } = await adminClient
            .from("attendees")
            .select("*")
            .order("created_at", { ascending: true });

        const data = rawData as unknown as Attendee[] | null;

        if (error) {
            return NextResponse.json({ error: "Failed to export." }, { status: 500 });
        }

        // Build CSV
        const headers = [
            "Registration ID",
            "First Name",
            "Last Name",
            "Email",
            "Phone",
            "USN",
            "Registration Time",
            "Check-in Status",
            "Check-in Time",
        ];

        const rows = (data || []).map((a) => [
            a.registration_id,
            a.first_name,
            a.last_name,
            a.email,
            a.phone,
            a.usn,
            format(new Date(a.created_at), "dd/MM/yyyy HH:mm:ss"),
            a.checked_in ? "Checked In" : "Registered",
            a.checked_in_at
                ? format(new Date(a.checked_in_at), "dd/MM/yyyy HH:mm:ss")
                : "",
        ]);

        const csvContent = [headers, ...rows]
            .map((row) =>
                row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
            )
            .join("\n");

        const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="registrations_${timestamp}.csv"`,
            },
        });
    } catch {
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
