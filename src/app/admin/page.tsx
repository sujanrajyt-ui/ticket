"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    Users, CheckCircle2, Clock, BarChart3, Search, Download,
    QrCode, LogOut, ChevronRight, SlidersHorizontal, RefreshCw, Ticket, Settings
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Attendee } from "@/types/database";
import { useEventConfig } from "@/components/EventConfigProvider";
import StatsCard from "@/components/admin/StatsCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const FILTERS = ["all", "not_checked_in", "checked_in"] as const;
type Filter = (typeof FILTERS)[number];
const FILTER_LABELS: Record<Filter, string> = {
    all: "All",
    checked_in: "Checked In",
    not_checked_in: "Not Checked In",
};

export default function AdminDashboard() {
    const router = useRouter();
    const { settings } = useEventConfig();
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [total, setTotal] = useState(0);
    const [checkedIn, setCheckedIn] = useState(0);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [userRole, setUserRole] = useState<"admin" | "volunteer" | null>("admin");

    const fetchData = useCallback(async () => {
        try {
            const params = new URLSearchParams({ search, filter });
            const res = await fetch(`/api/attendees?${params}`);
            if (res.status === 401) { router.push("/admin/login"); return; }
            const json = await res.json();
            setAttendees(json.attendees || []);
            setTotal(json.total || 0);
            setCheckedIn((json.attendees || []).filter((a: Attendee) => a.checked_in).length);
        } catch { /** network error */ } finally { setLoading(false); }
    }, [search, filter, router]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return;
            const { data: rawProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
            const profile = rawProfile as unknown as { role: "admin" | "volunteer" } | null;
            if (profile?.role) setUserRole(profile.role);
        });
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/admin/login");
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch("/api/export");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `registrations_${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } finally { setExporting(false); }
    };

    const remaining = total - checkedIn;
    const rate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#0c0516] text-white">
            {/* Top bar */}
            <header className="border-b border-[#241047] bg-[#120721] sticky top-0 z-20 shadow-md sticky-safe">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 font-bold">
                            <Ticket className="w-4 h-4 text-slate-950" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-black text-amber-400 truncate">{settings.name}</h1>
                            <p className="text-xs text-slate-400 hidden sm:block font-medium">Organizer Management Console</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button onClick={() => router.push("/admin/scan")} variant="primary" size="sm">
                            <QrCode className="w-4 h-4" />
                            <span className="hidden sm:inline">QR Kiosk Scanner</span>
                        </Button>
                        <Button onClick={() => router.push("/admin/settings")} variant="secondary" size="sm">
                            <Settings className="w-4 h-4" />
                        </Button>
                        <Button onClick={handleLogout} variant="ghost" size="sm">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatsCard title="Total Registrations" value={total} icon={<Users className="w-5 h-5" />} color="violet" />
                    <StatsCard title="Checked In" value={checkedIn} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
                    <StatsCard title="Remaining" value={remaining} icon={<Clock className="w-5 h-5" />} color="amber" />
                    <StatsCard title="Check-in Rate" value={`${rate}%`} icon={<BarChart3 className="w-5 h-5" />} color="blue" subtitle={`${checkedIn} of ${total} attendees`} />
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, USN, or Registration ID…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#150a29] border border-[#2e1457] rounded-xl px-3.5 py-2.5 pl-10 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />
                        <div className="flex bg-[#150a29] border border-[#2e1457] rounded-xl p-1 text-xs font-semibold">
                            {FILTERS.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg transition-colors ${filter === f ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
                                >
                                    {FILTER_LABELS[f]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <Button onClick={() => { setLoading(true); fetchData(); }} variant="secondary" size="sm">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        {userRole === "admin" && (
                            <Button onClick={handleExport} variant="secondary" size="sm" loading={exporting}>
                                <Download className="w-4 h-4" />
                                Export
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-[#140929] border border-[#2e1457] rounded-3xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#28124d] bg-[#1a0c36]">
                                    <th className="text-left px-4 py-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Attendee</th>
                                    <th className="text-left px-4 py-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider hidden sm:table-cell">USN</th>
                                    <th className="text-left px-4 py-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider hidden md:table-cell">Branch / Year</th>
                                    <th className="text-left px-4 py-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Reg ID</th>
                                    <th className="text-left px-4 py-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider hidden xl:table-cell">Check-in Time</th>
                                    <th className="w-8" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#231045]">
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-slate-500">Loading registrations...</td></tr>
                                ) : attendees.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-slate-500">No attendees found. Fill the form to register an attendee!</td></tr>
                                ) : (
                                    attendees.map((a) => (
                                        <tr
                                            key={a.id}
                                            onClick={() => router.push(`/admin/attendees/${a.registration_id}`)}
                                            className="hover:bg-[#1f0d3d] cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-3 font-semibold text-white">
                                                {a.first_name} {a.last_name}
                                                <p className="text-xs text-slate-400 font-normal">{a.email}</p>
                                            </td>
                                            <td className="px-4 py-3 text-amber-400 font-mono text-xs font-bold hidden sm:table-cell">{a.usn}</td>
                                            <td className="px-4 py-3 text-slate-300 text-xs hidden md:table-cell">{a.branch || "CSE"} • {a.year || "3rd Year"}</td>
                                            <td className="px-4 py-3 text-slate-400 hidden lg:table-cell font-mono text-xs">{a.registration_id}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={a.checked_in ? "success" : "neutral"} dot>
                                                    {a.checked_in ? "CHECKED IN" : "REGISTERED"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 hidden xl:table-cell text-xs">
                                                {a.checked_in_at ? format(new Date(a.checked_in_at), "dd MMM, h:mm a") : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                <ChevronRight className="w-4 h-4" />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-3 border-t border-[#241047] text-xs font-semibold text-slate-400 bg-[#10061f]">
                        Showing {attendees.length} of {total} registrations
                    </div>
                </div>
            </main>
        </div>
    );
}
