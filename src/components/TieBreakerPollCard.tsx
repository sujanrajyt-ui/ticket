"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { TieBreakerPoll } from "@/types/database";

interface TieBreakerPollCardProps {
    token: string;
}

export default function TieBreakerPollCard({ token }: TieBreakerPollCardProps) {
    const [loading, setLoading] = useState(true);
    const [checkedIn, setCheckedIn] = useState(false);
    const [poll, setPoll] = useState<TieBreakerPoll | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [votedCandidateId, setVotedCandidateId] = useState<string | undefined>();
    const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
    const [totalVotes, setTotalVotes] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`/api/poll?token=${encodeURIComponent(token)}`);
            const json = await res.json();
            if (res.ok) {
                setCheckedIn(json.checkedIn || false);
                setPoll(json.poll || null);
                setHasVoted(json.hasVoted || false);
                setVotedCandidateId(json.votedCandidateId);
                setVoteCounts(json.voteCounts || {});
                setTotalVotes(json.totalVotes || 0);
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchStatus();
        const iv = setInterval(fetchStatus, 5000);
        return () => clearInterval(iv);
    }, [fetchStatus]);

    const handleVote = async () => {
        if (!selected) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/poll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, candidate_id: selected }),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error || "Failed to submit vote.");
            } else {
                setHasVoted(true);
                setVotedCandidateId(selected);
                if (json.voteCounts) setVoteCounts(json.voteCounts);
                if (json.totalVotes) setTotalVotes(json.totalVotes);
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // Don't render anything while loading (avoids flicker on pass page)
    if (loading) return null;

    // Only show poll if attendee is checked-in AND admin has an active poll running
    if (!checkedIn || !poll || poll.status !== "active") return null;

    return (
        <div className="w-full bg-[#150a29] border border-[#3b1a6e] rounded-2xl p-5 space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2d1257] pb-3">
                <div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        Live Tie Breaker Poll
                    </span>
                    <p className="text-sm font-bold text-white">{poll.title}</p>
                </div>
                {hasVoted && (
                    <span className="text-[10px] font-black text-emerald-400 border border-emerald-700 bg-emerald-950/60 px-2 py-1 rounded-full uppercase tracking-wide">
                        ✓ Voted
                    </span>
                )}
            </div>

            {error && (
                <p className="text-xs text-red-400 font-semibold">{error}</p>
            )}

            {/* Candidates */}
            <div className="space-y-2">
                {poll.candidates.map((c) => {
                    const votes = voteCounts[c.id] || 0;
                    const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const isSelected = selected === c.id;
                    const isMyVote = votedCandidateId === c.id;

                    return (
                        <div
                            key={c.id}
                            onClick={() => !hasVoted && setSelected(c.id)}
                            className={`p-3 rounded-xl border transition-colors ${hasVoted
                                    ? isMyVote
                                        ? "bg-amber-500/10 border-amber-500/50"
                                        : "bg-[#100720] border-[#28114a]"
                                    : isSelected
                                        ? "bg-amber-500/15 border-amber-400 cursor-pointer"
                                        : "bg-[#100720] border-[#28114a] hover:border-[#421d7c] cursor-pointer"
                                }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    {!hasVoted && (
                                        <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${isSelected ? "border-amber-400 bg-amber-400" : "border-slate-500"
                                            }`}>
                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white truncate">
                                            {c.name}
                                            {isMyVote && (
                                                <span className="ml-2 text-[10px] text-amber-400 font-bold">← your vote</span>
                                            )}
                                        </p>
                                        {c.usn && (
                                            <p className="text-[11px] text-slate-500 font-mono">{c.usn}</p>
                                        )}
                                    </div>
                                </div>
                                {hasVoted && (
                                    <span className="text-sm font-black text-amber-400 flex-shrink-0">{percent}%</span>
                                )}
                            </div>

                            {hasVoted && (
                                <div className="mt-2 h-1.5 bg-[#1c0b38] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isMyVote ? "bg-amber-400" : "bg-purple-700"}`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Submit / Post-vote message */}
            {!hasVoted ? (
                <button
                    onClick={handleVote}
                    disabled={!selected || submitting}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : "Cast Your Vote"}
                </button>
            ) : (
                <p className="text-center text-xs text-slate-500">
                    Live results update every 5 seconds.
                </p>
            )}
        </div>
    );
}
