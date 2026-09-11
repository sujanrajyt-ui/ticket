"use client";

import { useEffect, useState, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface PollItem {
    id: string;
    name: string;
    usn?: string;
}

interface PollState {
    checkedIn: boolean;
    pollActive: boolean;
    pollTitle: string;
    candidates: PollItem[];
    hasVoted: boolean;
    votedCandidateId?: string;
    voteCounts: Record<string, number>;
    totalVotes: number;
}

interface PollViewProps {
    token: string;
    attendeeFirstName: string;
    children: ReactNode;
}

export default function PollView({ token, attendeeFirstName, children }: PollViewProps) {
    const [pollState, setPollState] = useState<PollState>({
        checkedIn: false,
        pollActive: false,
        pollTitle: "",
        candidates: [],
        hasVoted: false,
        votedCandidateId: undefined,
        voteCounts: {},
        totalVotes: 0,
    });
    const [checked, setChecked] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [voteError, setVoteError] = useState<string | null>(null);

    // Poll polling — runs every 5s, controls what view the user sees
    useEffect(() => {
        let cancelled = false;

        const fetchPoll = async () => {
            try {
                const res = await fetch(`/api/poll?token=${encodeURIComponent(token)}`);
                const json = await res.json();
                if (res.ok && !cancelled) {
                    setChecked(true);
                    setPollState({
                        checkedIn: json.checkedIn || false,
                        pollActive: !!(json.poll && json.poll.status === "active"),
                        pollTitle: json.poll?.title || "",
                        candidates: json.poll?.candidates || [],
                        hasVoted: json.hasVoted || false,
                        votedCandidateId: json.votedCandidateId,
                        voteCounts: json.voteCounts || {},
                        totalVotes: json.totalVotes || 0,
                    });
                }
            } catch { /* ignore */ }
        };

        fetchPoll();
        const iv = setInterval(fetchPoll, 5000);
        return () => { cancelled = true; clearInterval(iv); };
    }, [token]);

    const handleVote = async () => {
        if (!selected) return;
        setSubmitting(true);
        setVoteError(null);
        try {
            const res = await fetch("/api/poll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, candidate_id: selected }),
            });
            const json = await res.json();
            if (!res.ok) {
                setVoteError(json.error || "Failed to submit vote.");
            } else {
                setPollState((prev) => ({
                    ...prev,
                    hasVoted: true,
                    votedCandidateId: selected,
                    voteCounts: json.voteCounts || prev.voteCounts,
                    totalVotes: json.totalVotes || prev.totalVotes,
                }));
            }
        } catch {
            setVoteError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // Avoid flashing the pass before the first poll status arrives
    if (!checked) return null;

    const { checkedIn, pollActive, pollTitle, candidates, hasVoted, votedCandidateId } = pollState;

    // Active poll → show ONLY the poll, never the pass
    if (pollActive) {
        return (
            <main className="min-h-screen bg-[#0c0516] text-slate-100 py-8 px-4 sm:py-12">
                <div className="max-w-md mx-auto space-y-5">
                    {/* Header */}
                    <div className="text-center space-y-1">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            Live Tie Breaker Poll
                        </span>
                        <h1 className="text-lg font-black text-white">{pollTitle}</h1>
                        <p className="text-xs text-slate-500">Hi {attendeeFirstName} — {checkedIn ? "cast your vote below" : "please check in at the entrance to vote"}</p>
                    </div>

                    {voteError && (
                        <p className="text-xs text-red-400 font-semibold text-center">{voteError}</p>
                    )}

                    {!checkedIn ? (
                        <div className="bg-[#150a29] border border-[#2e1457] rounded-2xl p-5 text-center space-y-3">
                            <div className="text-2xl">🎟️</div>
                            <p className="text-sm font-bold text-white">You&apos;re not checked in yet</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                The live tie breaker poll is open for attendees who have checked in at the venue.
                                Show your official pass at the entrance and vote once you&apos;re checked in.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Candidates */}
                            <div className="space-y-2">
                                {candidates.map((c) => {
                                    const isSelected = selected === c.id;
                                    const isMyVote = votedCandidateId === c.id;

                                    return (
                                        <div
                                            key={c.id}
                                            onClick={() => !hasVoted && setSelected(c.id)}
                                            className={`p-4 rounded-2xl border transition-colors ${hasVoted
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
                                                            {isMyVote && <span className="ml-2 text-[10px] text-amber-400">← your vote</span>}
                                                        </p>
                                                        {c.usn && <p className="text-[11px] text-slate-500 font-mono">{c.usn}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {!hasVoted ? (
                                <button
                                    onClick={handleVote}
                                    disabled={!selected || submitting}
                                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : "Cast Your Vote"}
                                </button>
                            ) : (
                                <p className="text-center text-xs font-bold text-emerald-400">
                                    ✓ Vote submitted. Thank you!
                                </p>
                            )}
                        </>
                    )}
                </div>
            </main>
        );
    }

    // No active poll → show the pass/details content
    return <>{children}</>;
}