import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Profile } from "@/types/database";
import { EDITABLE_EVENT_FIELDS, EventSettings, mergeEventSettings } from "@/config/event";

async function requireAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized", status: 401 as const };

    const { data: rawProfile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
    const profile = rawProfile as unknown as Profile | null;
    if (!profile || profile.role !== "admin") {
        return { error: "Forbidden", status: 403 as const };
    }
    return { supabase };
}

export async function GET() {
    try {
        const auth = await requireAdmin();
        if (!auth.supabase) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const adminClient = await createAdminClient();
        const { data } = await adminClient
            .from("event_config")
            .select("settings")
            .eq("id", true)
            .single();
        const settings = mergeEventSettings(
            (data as unknown as { settings?: Partial<EventSettings> } | null)?.settings
        );
        return NextResponse.json({ settings });
    } catch {
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if (!auth.supabase) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
        }

        const clean: Partial<EventSettings> = {};
        for (const field of EDITABLE_EVENT_FIELDS) {
            const value = body?.[field];
            clean[field] = typeof value === "string" ? value.trim() : "";
        }

        const adminClient = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (adminClient.from("event_config") as any).upsert(
            {
                id: true,
                settings: clean,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
        );

        if (error) {
            return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
        }

        return NextResponse.json({ ok: true, settings: mergeEventSettings(clean) });
    } catch {
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}