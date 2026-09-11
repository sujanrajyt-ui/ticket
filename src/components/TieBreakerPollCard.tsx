"use client";

import { useEffect, useState, useCallback } from "react";
import { Vote, CheckCircle2, Trophy, Loader2 } from "lucide-react";
import { TieBreakerPoll } from "@/types/database";

interface TieBreakerPollCardProps {
    token: string;
}

export default function TieBreakerPollCard({ token }: TieBreakerPollCardProps) {
    const [loading, setLoading] = useState(true);
    const [checkedIn, setCheckedIn] = useState(false);
    const [poll, setPoll] = useState<TieBreakerPoll | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [votedCandidateId, setVotedCandidateId] = useState<string | undefined>(undefined);
    const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
    const [totalVotes, setTotalVotes] = useState(0);

    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPollStatus = useCallback(async () => {
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
        } catch {
            /* ignore network errors */
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchPollStatus();
        const interval = setInterval(fetchPollStatus, 5000);
        return () => clearInterval(interval);
    }, [fetchPollStatus]);

    const handleVote = async () => {
        if (!selectedCandidate) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/poll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    candidate_id: selectedCandidate,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error || "Failed to submit vote");
            } else {
                setHasVoted(true);
                setVotedCandidateId(selectedCandidate);
                if (json.voteCounts) setVoteCounts(json.voteCounts);
                if (json.totalVotes) setTotalVotes(json.totalVotes);
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // If still loading initially, return null to avoid flicker
    if (loading) return null;

    // Requirement: Non-checked in users will see the normal page (render nothing!)
    if (!checkedIn || !poll || poll.status !== "active") {
        return null;
    }

    return (
        <div
            className="w-full bg-[#17092e] border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-4"
            style={{
                boxShadow: "0 0 30px rgba(245, 158, 11, 0.15), 0 8px 32px rgba(0, 0, 0, 0.6)",
            }}
        >
            {/* Ambient Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Title Header */}
            <div className="flex items-center justify-between gap-3 border-b border-[#2e1457] pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[9px] font-black uppercase text-amber-400 tracking-wider mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            Live Tie Breaker Poll
                        </div>
                        <h3 className="text-sm font-black text-white">{poll.title}</h3>
                    </div>
                </div>

                {hasVoted && (
                    <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 px-2.5 py-1 rounded-full text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Voted
                    </div>
                )}
            </div>

            {error && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold">
                    {error}
                </div>
            )}

            {/* Candidates List */}
            <div className="space-y-2.5">
                {poll.candidates.map((c) => {
                    const votes = voteCounts[c.id] || 0;
                    const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const isSelected = selectedCandidate === c.id;
                    const isUserVote = votedCandidateId === c.id;

                    return (
                        <div
                            key={c.id}
                            onClick={() => !hasVoted && setSelectedCandidate(c.id)}
                            className={`p-3.5 rounded-2xl border transition-all ${hasVoted
                                ? isUserVote
                                    ? "bg-amber-500/15 border-amber-400"
                                    : "bg-[#100620] border-[#29124e]"
                                : isSelected
                                    ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 cursor-pointer shadow-lg shadow-amber-500/10"
                                    : "bg-[#100620] border-[#29124e] hover:border-[#421d7c] cursor-pointer"
                                }`}
                        >
                            <div className="flex items-center justify-between gap-3 mb-1.5">
                                <div className="flex items-center gap-3 min-w-0">
                                    {!hasVoted && (
                                        <div
                                            className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                ? "border-amber-400 bg-amber-400"
                                                : "border-slate-500 bg-transparent"
                                                }`}
                                        >
                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-extrabold text-white truncate">
                                            {c.name}
                                            {isUserVote && (
                                                <span className="ml-2 text-[10px] text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                                                    YOUR VOTE
                                                </span>
                                            )}
                                        </p>
                                        {(c.usn || c.branch) && (
                                            <p className="text-xs text-slate-400 font-medium truncate">
                                                {c.usn ? `USN: ${c.usn}` : ""} {c.usn && c.branch ? "•" : ""} {c.branch || ""}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {hasVoted && (
                                    <div className="text-right flex-shrink-0">
                                        <span className="text-sm font-black text-amber-400">{percent}%</span>
                                        <p className="text-[10px] text-slate-400 font-medium">{votes} votes</p>
                                    </div>
                                )}
                            </div>

                            {/* Progress bar after voting */}
                            {hasVoted && (
                                <div className="w-full bg-[#1c0b38] h-2 rounded-full overflow-hidden mt-2 border border-[#2d1454]">
                                    <div
                                        className={`h-full transition-all duration-500 rounded-full ${isUserVote ? "bg-gradient-to-r from-amber-500 to-amber-300" : "bg-purple-600/80"
                                            }`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Voting Action Button */}
            {!hasVoted ? (
                <button
                    onClick={handleVote}
                    disabled={!selectedCandidate || submitting}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm py-3 rounded-2xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                            Submitting Vote...
                        </>
                    ) : (
                        <>
                            <Vote className="w-4 h-4" />
                            Cast Your Vote
                        </>
                    )}
                </button>
            ) : (
                <div className="text-center pt-1">
                    <p className="text-[11px] text-slate-400 font-medium">
                        ✦ Live tally updates automatically · Thank you for voting! ✦
                    </p>
                </div>
            )}
        </div>
    );
}
