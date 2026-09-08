"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Settings, Loader2 } from "lucide-react";
import { EVENT_SETTING_FIELDS, EventSettings } from "@/config/event";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminSettingsPage() {
    const router = useRouter();
    const [values, setValues] = useState<EventSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch("/api/admin/event-config");
                if (res.status === 401) { router.push("/admin/login"); return; }
                const json = await res.json();
                if (!cancelled && json.settings) setValues(json.settings);
            } catch {
                if (!cancelled) setMessage({ type: "error", text: "Failed to load event settings." });
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [router]);

    const updateField = (field: keyof EventSettings, value: string | boolean) => {
        setValues((prev) => (prev ? { ...prev, [field]: value as never } : prev));
    };

    const handleSave = async () => {
        if (!values) return;
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/admin/event-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            const json = await res.json();
            if (!res.ok) {
                setMessage({ type: "error", text: json.error || "Failed to save settings." });
            } else {
                setMessage({ type: "success", text: "Event settings saved." });
            }
        } catch {
            setMessage({ type: "error", text: "Network error. Could not save settings." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0c0516] text-white">
            <header className="border-b border-[#241047] bg-[#120721] sticky top-0 z-20 shadow-md sticky-safe">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => router.push("/admin")}
                            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Dashboard
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
                        <Settings className="w-4 h-4" /> Event Info Editor
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-white">Event Info</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Changes apply instantly to the public registration page and ticket pass.
                    </p>
                </div>

                {message && (
                    <div
                        className={`p-4 rounded-2xl border text-xs font-semibold ${
                            message.type === "success"
                                ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
                                : "bg-red-950/80 border-red-800 text-red-300"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center gap-3 py-16">
                        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                        <p className="text-xs text-slate-400 font-semibold">Loading event settings...</p>
                    </div>
                ) : values ? (
                    <div className="space-y-5">
                        {EVENT_SETTING_FIELDS.map((field) => (
                            <div key={field.key}>
                                {field.type === "textarea" ? (
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                                            {field.label}
                                        </label>
                                        <textarea
                                            value={values[field.key] as string}
                                            onChange={(e) => updateField(field.key, e.target.value)}
                                            rows={4}
                                            className="w-full bg-[#120721] border border-[#2b144e] rounded-xl px-4 py-3 text-base text-white placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                        />
                                    </div>
                                ) : field.type === "boolean" ? (
                                    <div className="flex items-start justify-between gap-4 rounded-2xl bg-[#150a29] border border-[#2e1457] p-4">
                                        <div>
                                            <p className="text-sm font-bold text-white">{field.label}</p>
                                            {field.hint && (
                                                <p className="text-xs text-slate-400 mt-0.5">{field.hint}</p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={Boolean(values[field.key])}
                                            onClick={() => updateField(field.key, !values[field.key])}
                                            className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${values[field.key] ? "bg-amber-500" : "bg-[#2b144e]"}`}
                                        >
                                            <span
                                                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${values[field.key] ? "translate-x-[22px]" : "translate-x-0.5"}`}
                                            />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <Input
                                            label={field.label}
                                            value={values[field.key] as string}
                                            onChange={(e) => updateField(field.key, e.target.value)}
                                        />
                                        {field.hint && (
                                            <p className="text-xs text-amber-400/80 mt-1.5">{field.hint}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="pt-2">
                            <Button onClick={handleSave} loading={saving} size="lg" fullWidth>
                                <Save className="w-4 h-4" /> Save Event Info
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 rounded-2xl bg-[#150a29] border border-[#2e1457] text-center text-sm text-slate-400">
                        Could not load event settings.
                    </div>
                )}
            </main>
        </div>
    );
}