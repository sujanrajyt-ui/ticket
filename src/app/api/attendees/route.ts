import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Profile } from "@/types/database";

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

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const filter = searchParams.get("filter") || "all"; // all | checked_in | not_checked_in
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = (page - 1) * limit;

        const adminClient = await createAdminClient();
        let query = adminClient
            .from("attendees")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (search) {
            query = query.or(
                `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,usn.ilike.%${search}%,registration_id.ilike.%${search}%`
            );
        }

        if (filter === "checked_in") query = query.eq("checked_in", true);
        if (filter === "not_checked_in") query = query.eq("checked_in", false);

        const { data, error, count } = await query;
        if (error) {
            console.error("Attendees query error:", error);
            return NextResponse.json({ error: "Failed to fetch attendees." }, { status: 500 });
        }

        return NextResponse.json({ attendees: data, total: count, page, limit });
    } catch (err) {
        console.error("Attendees API error:", err);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
