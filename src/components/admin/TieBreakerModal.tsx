"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Trophy, Users, Search, Check, Play, StopCircle, RefreshCw, Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { TieBreakerPoll, TieBreakerCandidate } from "@/types/database";

interface CheckedInCandidate {
    id: string;
    name: string;
    usn: string;
    branch: string;
    qr_token: string;
}

interface TieBreakerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TieBreakerModal({ isOpen, onClose }: TieBreakerModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [poll, setPoll] = useState<TieBreakerPoll | null>(null);
    const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
    const [totalVotes, setTotalVotes] = useState(0);
    const [checkedInCandidates, setCheckedInCandidates] = useState<CheckedInCandidate[]>([]);

    const [pollTitle, setPollTitle] = useState("Tie Breaker Voting Poll");
    const [selectedCandidates, setSelectedCandidates] = useState<TieBreakerCandidate[]>([]);
    const [manualNameInput, setManualNameInput] = useState("");
    const [search, setSearch] = useState("");

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/tie-breaker");
            const json = await res.json();
            if (res.ok) {
                setPoll(json.poll || null);
                setVoteCounts(json.voteCounts || {});
                setTotalVotes(json.totalVotes || 0);
                setCheckedInCandidates(json.checkedInCandidates || []);
                if (json.poll?.title) setPollTitle(json.poll.title);
            }
        } catch {
            setError("Failed to fetch tie breaker data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetchData();
            const interval = setInterval(fetchData, 4000);
            return () => clearInterval(interval);
        }
    }, [isOpen, fetchData]);

    const handleAddManualCandidate = () => {
        const name = manualNameInput.trim();
        if (!name) return;

        if (selectedCandidates.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
            setError("Candidate with this name is already added.");
            return;
        }

        const newCand: TieBreakerCandidate = {
            id: `cand-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name,
            usn: "",
            branch: "Manual Entry",
        };

        setSelectedCandidates((prev) => [...prev, newCand]);
        setManualNameInput("");
        setError(null);
    };

    const toggleCheckedInCandidate = (c: CheckedInCandidate) => {
        setSelectedCandidates((prev) => {
            const exists = prev.some((item) => item.id === c.id || (c.usn && item.usn === c.usn));
            if (exists) {
                return prev.filter((item) => item.id !== c.id && item.usn !== c.usn);
            }
            return [
                ...prev,
                {
                    id: c.id,
                    name: c.name,
                    usn: c.usn || "",
                    branch: c.branch || "N/A",
                },
            ];
        });
        setError(null);
    };

    const removeCandidate = (id: string) => {
        setSelectedCandidates((prev) => prev.filter((c) => c.id !== id));
    };

    const handleStartPoll = async () => {
        if (selectedCandidates.length < 2) {
            setError("Please add at least 2 candidates for the tie breaker poll.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/tie-breaker", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: pollTitle.trim() || "Tie Breaker Voting Poll",
                    candidates: selectedCandidates,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error || "Failed to trigger poll");
            } else {
                setPoll(json.poll);
                fetchData();
            }
        } catch {
            setError("Network error starting poll.");
        } finally {
            setSaving(false);
        }
    };

    const handleClosePoll = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/tie-breaker", { method: "DELETE" });
            if (res.ok) {
                setPoll(null);
                setSelectedCandidates([]);
                fetchData();
            }
        } catch {
            setError("Failed to end poll");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const filteredCandidates = checkedInCandidates.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.usn.toLowerCase().includes(search.toLowerCase()) ||
            c.branch.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#140829] border-2 border-[#3d1973] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">

                {/* Header */}
                <div className="p-5 border-b border-[#2d1257] bg-[#1a0c36] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-amber-400">Tie Breaker Poll Management</h2>
                            <p className="text-xs text-slate-300 font-medium">Add candidates manually or from checked-in list & trigger live poll</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#2e1457] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto space-y-5 flex-1">
                    {error && (
                        <div className="p-3.5 rounded-xl bg-red-950/90 border border-red-800 text-red-200 text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ACTIVE POLL CONTROL & LIVE RESULTS */}
                    {poll && poll.status === "active" ? (
                        <div className="bg-[#1c0c3a] border-2 border-amber-500/50 rounded-2xl p-5 space-y-4 shadow-xl">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#35186b] pb-3">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                        POLL IS LIVE NOW
                                    </div>
                                    <h3 className="text-base font-black text-white mt-1">{poll.title}</h3>
                                    <p className="text-xs text-slate-400">Total votes cast: <span className="text-amber-400 font-black">{totalVotes}</span></p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button
                                        onClick={fetchData}
                                        variant="secondary"
                                        size="sm"
                                        className="border-[#38186e]"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        onClick={handleClosePoll}
                                        loading={saving}
                                        variant="ghost"
                                        size="sm"
                                        className="bg-red-950/80 border border-red-800 text-red-300 hover:bg-red-900 font-bold"
                                    >
                                        <StopCircle className="w-4 h-4" /> End Poll
                                    </Button>
                                </div>
                            </div>

                            {/* Live Vote Breakdown */}
                            <div className="space-y-3 pt-1">
                                <p className="text-xs font-extrabold uppercase text-amber-400 tracking-wider">Live Vote Distribution</p>
                                {poll.candidates.map((c) => {
                                    const votes = voteCounts[c.id] || 0;
                                    const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

                                    return (
                                        <div key={c.id} className="bg-[#120726] border border-[#2e1457] rounded-xl p-3 space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="min-w-0">
                                                    <span className="font-extrabold text-white">{c.name}</span>
                                                    {c.usn && <span className="text-slate-400 ml-2 font-mono text-[11px]">{c.usn}</span>}
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-black text-amber-400 text-sm">{votes}</span>
                                                    <span className="text-slate-400 text-xs ml-1">({percent}%)</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-[#1e0a3d] h-2 rounded-full overflow-hidden border border-[#35176b]">
                                                <div
                                                    className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* CREATE NEW POLL FORM */
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Tie Breaker Title
                                </label>
                                <input
                                    type="text"
                                    value={pollTitle}
                                    onChange={(e) => setPollTitle(e.target.value)}
                                    placeholder="e.g. Final Tie Breaker — Performance Round"
                                    className="w-full bg-[#120724] border border-[#2e1457] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            {/* 1. MANUAL CANDIDATE INPUT */}
                            <div className="bg-[#190933] border border-[#361769] rounded-2xl p-4 space-y-3">
                                <label className="block text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                                    ✍️ Add Candidate Manually
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={manualNameInput}
                                        onChange={(e) => setManualNameInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddManualCandidate()}
                                        placeholder="Type candidate name (e.g. Rahul / Team Alpha)..."
                                        className="flex-1 bg-[#100621] border border-[#2b1252] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                    <button
                                        onClick={handleAddManualCandidate}
                                        type="button"
                                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors flex-shrink-0"
                                    >
                                        <Plus className="w-4 h-4 stroke-[3]" /> Add
                                    </button>
                                </div>
                            </div>

                            {/* 2. SELECTED CANDIDATES LIST */}
                            {selectedCandidates.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                                            Added Candidates List ({selectedCandidates.length})
                                        </label>
                                    </div>
                                    <div className="flex flex-wrap gap-2 bg-[#100621] border border-[#2b1252] p-3 rounded-2xl max-h-36 overflow-y-auto">
                                        {selectedCandidates.map((c) => (
                                            <div
                                                key={c.id}
                                                className="bg-[#240e47] border border-[#441c82] rounded-xl px-3 py-1.5 text-xs font-bold text-white flex items-center gap-2 shadow-sm"
                                            >
                                                <span>{c.name}</span>
                                                {c.usn && <span className="text-[10px] text-amber-400 font-mono">({c.usn})</span>}
                                                <button
                                                    onClick={() => removeCandidate(c.id)}
                                                    className="text-slate-400 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 3. CHECKED-IN ATTENDEE PICKER */}
                            <div className="space-y-2 pt-1">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                                        Or Pick From Checked-In Attendees
                                    </label>
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        {checkedInCandidates.length} checked-in
                                    </span>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search checked-in attendees by name or USN..."
                                        className="w-full bg-[#120724] border border-[#2e1457] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div className="bg-[#100621] border border-[#2b1252] rounded-2xl max-h-44 overflow-y-auto divide-y divide-[#1e0a3d]">
                                    {loading ? (
                                        <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2 font-medium">
                                            <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> Loading checked-in attendees...
                                        </div>
                                    ) : filteredCandidates.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 text-xs font-semibold space-y-1">
                                            <Users className="w-5 h-5 mx-auto text-slate-500 mb-1" />
                                            <p>No checked-in attendees found.</p>
                                        </div>
                                    ) : (
                                        filteredCandidates.map((c) => {
                                            const isSelected = selectedCandidates.some((item) => item.id === c.id || (c.usn && item.usn === c.usn));
                                            return (
                                                <div
                                                    key={c.id}
                                                    onClick={() => toggleCheckedInCandidate(c)}
                                                    className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${isSelected ? "bg-amber-500/15 text-white" : "hover:bg-[#190933] text-slate-300"
                                                        }`}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-extrabold text-white truncate">{c.name}</p>
                                                        <p className="text-[11px] text-slate-400 font-medium truncate">
                                                            USN: <span className="text-amber-400 font-mono font-bold">{c.usn || "N/A"}</span> • {c.branch}
                                                        </p>
                                                    </div>

                                                    <div
                                                        className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                            ? "bg-amber-500 border-amber-400 text-slate-950"
                                                            : "border-slate-600 bg-transparent"
                                                            }`}
                                                    >
                                                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-[#2d1257] bg-[#180a33] flex items-center justify-between gap-3">
                    <Button onClick={onClose} variant="secondary" size="sm">
                        Close
                    </Button>

                    {(!poll || poll.status !== "active") && (
                        <Button
                            onClick={handleStartPoll}
                            loading={saving}
                            disabled={selectedCandidates.length < 2}
                            variant="primary"
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg"
                        >
                            <Play className="w-4 h-4 fill-slate-950" /> Trigger & Launch Live Poll ({selectedCandidates.length} Candidates)
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
