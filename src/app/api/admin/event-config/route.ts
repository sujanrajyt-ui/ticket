import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Profile } from "@/types/database";
import { EVENT_SETTING_FIELDS, EventSettings, mergeEventSettings } from "@/config/event";

async function requireAdmin() {
    // Accept cookie-based admin session (used by the hardcoded login)
    const cookieStore = await cookies();
    const adminSessionRaw = cookieStore.get("admin_session")?.value;
    if (adminSessionRaw) {
        try {
            const session = JSON.parse(adminSessionRaw) as { role?: string };
            if (session.role === "admin") {
                return { supabase: await createAdminClient() };
            }
            return { error: "Forbidden", status: 403 as const };
        } catch {
            return { error: "Unauthorized", status: 401 as const };
        }
    }

    // Fallback: Supabase JWT auth
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

        const clean: Record<string, unknown> = {};
        for (const field of EVENT_SETTING_FIELDS) {
            const value = body?.[field.key];
            if (field.type === "boolean") {
                clean[field.key] = typeof value === "boolean" ? value : Boolean(value);
            } else {
                clean[field.key] = typeof value === "string" ? value.trim() : "";
            }
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

        return NextResponse.json({ ok: true, settings: mergeEventSettings(clean as Partial<EventSettings>) });
    } catch {
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}