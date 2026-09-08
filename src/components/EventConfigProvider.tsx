"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_EVENT_SETTINGS, EventSettings, mergeEventSettings } from "@/config/event";

interface EventConfigContextValue {
    settings: EventSettings;
    loading: boolean;
}

const EventConfigContext = createContext<EventConfigContextValue>({
    settings: DEFAULT_EVENT_SETTINGS,
    loading: true,
});

export function useEventConfig() {
    return useContext(EventConfigContext);
}

export default function EventConfigProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<EventSettings>(DEFAULT_EVENT_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const supabase = createClient();
                const { data } = await supabase
                    .from("event_config")
                    .select("settings")
                    .eq("id", true)
                    .single();
                if (cancelled) return;
                const row = data as unknown as { settings?: Partial<EventSettings> } | null;
                setSettings(mergeEventSettings(row?.settings));
            } catch {
                // keep defaults
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    return (
        <EventConfigContext.Provider value={{ settings, loading }}>
            {children}
        </EventConfigContext.Provider>
    );
}