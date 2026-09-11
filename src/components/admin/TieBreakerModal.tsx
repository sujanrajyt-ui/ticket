"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Trophy, Users, Search, Check, Play, StopCircle, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { TieBreakerPoll } from "@/types/database";

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
    const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
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

    const toggleCandidate = (id: string) => {
        setSelectedCandidateIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleStartPoll = async () => {
        if (selectedCandidateIds.length < 2) {
            setError("Please select at least 2 checked-in candidates for the tie breaker.");
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
                    candidateIds: selectedCandidateIds,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error || "Failed to start poll");
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
                setSelectedCandidateIds([]);
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
                            <p className="text-xs text-slate-300 font-medium">Create polls & view live votes for checked-in attendees</p>
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
                                        POLL ACTIVE
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
                                                    <span className="text-slate-400 ml-2 font-mono text-[11px]">{c.usn}</span>
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
                        <div className="space-y-4">
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

                            {/* Candidate Selector Header */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                                        Select Candidates (Checked-In Only)
                                    </label>
                                    <span className="text-xs text-slate-300 font-bold bg-[#1e0b3c] border border-[#331466] px-2.5 py-0.5 rounded-full">
                                        {selectedCandidateIds.length} Selected
                                    </span>
                                </div>

                                <p className="text-xs text-slate-400">
                                    Only checked-in participants are eligible to be selected as tie breaker candidates.
                                </p>

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
                            </div>

                            {/* Candidate Selection List */}
                            <div className="bg-[#100621] border border-[#2b1252] rounded-2xl max-h-60 overflow-y-auto divide-y divide-[#1e0a3d]">
                                {loading ? (
                                    <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2 font-medium">
                                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> Loading checked-in attendees...
                                    </div>
                                ) : filteredCandidates.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-xs font-semibold space-y-1">
                                        <Users className="w-6 h-6 mx-auto text-slate-500 mb-1" />
                                        <p>No checked-in attendees found.</p>
                                        <p className="text-[11px] text-slate-500">Perform check-ins via QR scanner first to add candidates.</p>
                                    </div>
                                ) : (
                                    filteredCandidates.map((c) => {
                                        const isSelected = selectedCandidateIds.includes(c.id);
                                        return (
                                            <div
                                                key={c.id}
                                                onClick={() => toggleCandidate(c.id)}
                                                className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${isSelected ? "bg-amber-500/15 text-white" : "hover:bg-[#190933] text-slate-300"
                                                    }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-sm font-extrabold text-white truncate">{c.name}</p>
                                                    <p className="text-xs text-slate-400 font-medium truncate">
                                                        USN: <span className="text-amber-400 font-mono font-bold">{c.usn || "N/A"}</span> • {c.branch}
                                                    </p>
                                                </div>

                                                <div
                                                    className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                        ? "bg-amber-500 border-amber-400 text-slate-950"
                                                        : "border-slate-600 bg-transparent"
                                                        }`}
                                                >
                                                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
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
                            disabled={selectedCandidateIds.length < 2}
                            variant="primary"
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                        >
                            <Play className="w-4 h-4 fill-slate-950" /> Start Tie Breaker Poll ({selectedCandidateIds.length})
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
