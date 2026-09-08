import { DEFAULT_EVENT_SETTINGS, EventSettings, mergeEventSettings } from "@/config/event";
import { createAdminClient } from "@/lib/supabase/server";
import { EventConfigRow } from "@/types/database";

export async function getEventSettingsServer(): Promise<EventSettings> {
    try {
        const supabase = await createAdminClient();
        const { data } = await supabase
            .from("event_config")
            .select("settings")
            .eq("id", true)
            .single();
        const row = data as unknown as Pick<EventConfigRow, "settings"> | null;
        return mergeEventSettings(row?.settings as Partial<EventSettings> | null);
    } catch {
        return DEFAULT_EVENT_SETTINGS;
    }
}