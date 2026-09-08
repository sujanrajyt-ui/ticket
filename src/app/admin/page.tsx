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
        <div className="min-h-screen bg-[#0c0516] text-white selection:bg-amber-500 selection:text-black">
            {/* Ambient purple spotlight glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-purple-900/20 via-amber-500/5 to-transparent blur-3xl pointer-events-none z-0" />

            {/* Top bar */}
            <header className="border-b border-[#2a1352] bg-[#120721]/90 backdrop-blur-md sticky top-0 z-20 shadow-2xl sticky-safe">
                <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 font-black shadow-lg shadow-amber-500/20 border border-amber-300">
                            <Ticket className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-black text-white tracking-tight truncate">{settings.name}</h1>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                                    {userRole === "admin" ? "👑 Admin Console" : "🛡️ Volunteer Kiosk"}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 hidden sm:block font-semibold">NITTE'S GOT LATENT &bull; Event Management & Check-in</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                        <Button
                            onClick={() => router.push("/admin/scan")}
                            variant="primary"
                            size="sm"
                            className="shadow-xl shadow-amber-500/20 py-2 px-4 text-xs sm:text-sm font-black tracking-wide bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 border border-amber-300"
                        >
                            <QrCode className="w-4 h-4 text-slate-950" />
                            <span className="hidden sm:inline">Launch QR Scanner</span>
                        </Button>
                        <Button onClick={() => router.push("/admin/settings")} variant="secondary" size="sm" className="bg-[#1b0c36] border-[#36196a] text-slate-200 hover:text-white">
                            <Settings className="w-4 h-4" />
                        </Button>
                        <Button onClick={handleLogout} variant="ghost" size="sm" className="text-slate-400 hover:text-red-400">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-6 relative z-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard title="Total Registrations" value={total} icon={<Users className="w-5 h-5 text-amber-400" />} color="violet" />
                    <StatsCard title="Checked In" value={checkedIn} icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} color="emerald" />
                    <StatsCard title="Remaining" value={remaining} icon={<Clock className="w-5 h-5 text-amber-400" />} color="amber" />
                    <StatsCard title="Check-in Rate" value={`${rate}%`} icon={<BarChart3 className="w-5 h-5 text-blue-400" />} color="blue" subtitle={`${checkedIn} of ${total} checked in`} />
                </div>

                {/* Controls Bar */}
                <div className="bg-[#140929]/90 border border-[#2e1457] backdrop-blur-md rounded-2xl p-3 flex flex-col sm:flex-row gap-3 shadow-xl">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                        <input
                            type="text"
                            placeholder="Search attendee by name, USN, email, or Reg ID…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#1b0c36] border border-[#371969] rounded-xl px-3.5 py-2.5 pl-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/80 font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />
                        <div className="flex bg-[#1b0c36] border border-[#371969] rounded-xl p-1 text-xs font-bold">
                            {FILTERS.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${filter === f ? "bg-amber-400 text-slate-950 font-black shadow-md" : "text-slate-300 hover:text-white"}`}
                                >
                                    {FILTER_LABELS[f]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <Button onClick={() => { setLoading(true); fetchData(); }} variant="secondary" size="sm" className="bg-[#1b0c36] border-[#371969]">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        {userRole === "admin" && (
                            <Button onClick={handleExport} variant="secondary" size="sm" loading={exporting} className="bg-[#1b0c36] border-[#371969]">
                                <Download className="w-4 h-4 text-amber-400" />
                                Export CSV
                            </Button>
                        )}
                    </div>
                </div>

                {/* Goated Attendee Table */}
                <div className="bg-[#140929]/90 border-2 border-[#2e1457] rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#2a1352] bg-[#1a0c36]/90">
                                    <th className="text-left px-5 py-4 text-xs font-black text-slate-300 uppercase tracking-wider">Attendee</th>
                                    <th className="text-left px-5 py-4 text-xs font-black text-slate-300 uppercase tracking-wider hidden sm:table-cell">USN</th>
                                    <th className="text-left px-5 py-4 text-xs font-black text-slate-300 uppercase tracking-wider hidden md:table-cell">Branch & Year</th>
                                    <th className="text-left px-5 py-4 text-xs font-black text-slate-300 uppercase tracking-wider hidden lg:table-cell">Reg ID</th>
                                    <th className="text-left px-5 py-4 text-xs font-black text-slate-300 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-5 py-4 text-xs font-black text-slate-300 uppercase tracking-wider hidden xl:table-cell">Check-In Time</th>
                                    <th className="w-8" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#231045]">
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-slate-400 font-semibold">Loading registrations…</td></tr>
                                ) : attendees.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-slate-400 font-semibold">No attendee registrations found.</td></tr>
                                ) : (
                                    attendees.map((a) => (
                                        <tr
                                            key={a.id}
                                            onClick={() => router.push(`/admin/attendees/${a.registration_id}`)}
                                            className="hover:bg-[#230e47] cursor-pointer transition-all group"
                                        >
                                            <td className="px-5 py-4 font-extrabold text-white">
                                                <span className="group-hover:text-amber-300 transition-colors text-base">
                                                    {(a.first_name + " " + a.last_name).trim()}
                                                </span>
                                                <p className="text-xs text-slate-400 font-medium mt-0.5">{a.email}</p>
                                            </td>
                                            <td className="px-5 py-4 text-amber-400 font-mono text-xs font-bold hidden sm:table-cell">{a.usn || "N/A"}</td>
                                            <td className="px-5 py-4 text-slate-300 text-xs hidden md:table-cell font-semibold">
                                                <span className="bg-[#240e48] border border-[#3b1a6e] px-2.5 py-1 rounded-lg">
                                                    {a.branch || "CSE"} &bull; {a.year || "3rd Year"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-400 hidden lg:table-cell font-mono text-xs font-bold">{a.registration_id}</td>
                                            <td className="px-5 py-4">
                                                <Badge variant={a.checked_in ? "success" : "neutral"} dot>
                                                    {a.checked_in ? "CHECKED IN" : "REGISTERED"}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-4 text-slate-400 hidden xl:table-cell text-xs font-semibold">
                                                {a.checked_in_at ? format(new Date(a.checked_in_at), "dd MMM, h:mm a") : "—"}
                                            </td>
                                            <td className="px-5 py-4 text-slate-500 group-hover:text-amber-400 transition-colors">
                                                <ChevronRight className="w-5 h-5" />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-5 py-3.5 border-t border-[#241047] text-xs font-extrabold text-slate-400 bg-[#10061f] flex items-center justify-between">
                        <span>Showing {attendees.length} of {total} registrations</span>
                        <span className="text-amber-400/80">NITTE'S GOT LATENT &bull; LIVE</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
