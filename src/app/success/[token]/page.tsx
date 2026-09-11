"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Share2, Printer, CheckCircle2, MapPin, Calendar, Loader2 } from "lucide-react";
import { generateQRDataURL, downloadQRCode } from "@/lib/qr";
import { useEventConfig } from "@/components/EventConfigProvider";
import Button from "@/components/ui/Button";

interface AttendeeInfo {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    usn: string;
    branch?: string;
    year?: string;
    registration_id: string;
    created_at: string;
}

interface PollCandidate {
    id: string;
    name: string;
    usn?: string;
}

interface PollState {
    checkedIn: boolean;
    pollActive: boolean;
    pollTitle: string;
    candidates: PollCandidate[];
    hasVoted: boolean;
    votedCandidateId?: string;
    voteCounts: Record<string, number>;
    totalVotes: number;
}

export default function SuccessPage() {
    const params = useParams<{ token: string }>();
    const router = useRouter();
    const { settings } = useEventConfig();
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const [attendee, setAttendee] = useState<AttendeeInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Poll state
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
    const [selected, setSelected] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [voteError, setVoteError] = useState<string | null>(null);

    // Fetch attendee info
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const token = params.token;
            try { localStorage.setItem("attendee_qr_token", token); } catch { /* ignore */ }

            const stored = sessionStorage.getItem(`reg_${token}`);
            let storedData: AttendeeInfo | null = null;
            if (stored) {
                try { storedData = JSON.parse(stored); } catch { /* ignore */ }
            }

            let json: { found?: boolean; name?: string; usn?: string; registration_id?: string; branch?: string; year?: string } | null = null;
            try {
                const res = await fetch(`/api/lookup?token=${encodeURIComponent(token)}`);
                json = await res.json();
            } catch {
                if (!storedData) setError("Network error loading ticket.");
            }

            if (cancelled) return;

            if (storedData) setAttendee(storedData);

            if (json?.found) {
                setAttendee((prev) => ({
                    first_name: json!.name!.split(" ")[0] || "Attendee",
                    last_name: json!.name!.split(" ").slice(1).join(" ") || "",
                    usn: json?.usn || "",
                    registration_id: json?.registration_id || "",
                    email: prev?.email || "registered@nitte.edu.in",
                    phone: prev?.phone || "9876543210",
                    branch: json?.branch || prev?.branch || "Computer Science & Engineering (CSE)",
                    year: json?.year || prev?.year || "3rd Year",
                    created_at: prev?.created_at || new Date().toISOString(),
                }));
            } else if (json && !storedData) {
                setError("Ticket details not found.");
            }

            generateQRDataURL(token)
                .then((url) => { if (!cancelled) setQrDataUrl(url); })
                .finally(() => { if (!cancelled) setLoading(false); });
        })();

        return () => { cancelled = true; };
    }, [params.token]);

    // Poll polling — runs every 5s, controls what view the user sees
    useEffect(() => {
        const fetchPoll = async () => {
            try {
                const res = await fetch(`/api/poll?token=${encodeURIComponent(params.token)}`);
                const json = await res.json();
                if (res.ok) {
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
        return () => clearInterval(iv);
    }, [params.token]);

    const handleVote = async () => {
        if (!selected) return;
        setSubmitting(true);
        setVoteError(null);
        try {
            const res = await fetch("/api/poll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: params.token, candidate_id: selected }),
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

    const handleDownload = () => {
        if (qrDataUrl && attendee) downloadQRCode(qrDataUrl, attendee.registration_id);
    };

    const handleShare = async () => {
        if (navigator.share && attendee) {
            try {
                await navigator.share({
                    title: `${settings.name} Entry Pass`,
                    text: `Official Ticket Pass for ${attendee.first_name} (${attendee.registration_id}) - ${settings.name}`,
                    url: window.location.href,
                });
            } catch { /* cancelled */ }
        } else {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0c0516] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-xs font-semibold">Generating your Official Digital Ticket Pass...</p>
                </div>
            </div>
        );
    }

    if (error || !attendee) {
        return (
            <div className="min-h-screen bg-[#0c0516] flex items-center justify-center p-4">
                <div className="max-w-sm w-full text-center bg-[#150a29] border border-[#2e1457] rounded-3xl p-8 shadow-2xl">
                    <p className="text-red-400 font-bold text-lg mb-1">Pass Not Found</p>
                    <p className="text-slate-400 text-xs">{error}</p>
                    <Button onClick={() => router.push("/")} className="mt-6" fullWidth>Return to Registration</Button>
                </div>
            </div>
        );
    }

    const fullName = `${attendee.first_name} ${attendee.last_name}`.trim();
    const { checkedIn, pollActive, pollTitle, candidates, hasVoted, votedCandidateId, voteCounts, totalVotes } = pollState;

    // ── POLL VIEW: poll is active — show ONLY the poll, never the pass ───────
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
                        <p className="text-xs text-slate-500">Hi {attendee.first_name} — {checkedIn ? "cast your vote below" : "please check in at the entrance to vote"}</p>
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
                                    const votes = voteCounts[c.id] || 0;
                                    const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
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
                                                {hasVoted && (
                                                    <span className="text-sm font-black text-amber-400 flex-shrink-0">{percent}%</span>
                                                )}
                                            </div>

                                            {hasVoted && (
                                                <div className="mt-2.5 h-1.5 bg-[#1c0b38] rounded-full overflow-hidden">
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

                            {!hasVoted ? (
                                <button
                                    onClick={handleVote}
                                    disabled={!selected || submitting}
                                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : "Cast Your Vote"}
                                </button>
                            ) : (
                                <p className="text-center text-xs text-slate-500">
                                    {hasVoted ? "✓ Vote submitted. " : ""}Live results update every 5 seconds.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </main>
        );
    }

    // ── PASS VIEW: poll not active or not checked-in ──────────────────────────
    return (
        <main className="min-h-screen bg-[#0c0516] text-slate-100 py-8 px-4 sm:py-12">
            <div className="max-w-md mx-auto space-y-5">
                {/* Header Banner */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Registration Successful
                    </div>
                    <h1 className="text-xl font-black text-white tracking-tight">YOUR OFFICIAL ENTRY PASS</h1>
                </div>

                {/* ── TICKET PASS CARD ── */}
                <div
                    className="bg-[#150a29] border-2 border-[#3b1a6e] rounded-3xl overflow-hidden relative"
                    style={{ boxShadow: "0 0 0 1px rgba(120,50,220,0.2), 0 8px 40px rgba(80,20,180,0.5), 0 20px 60px rgba(0,0,0,0.6)" }}
                >
                    {/* Top Pass Header */}
                    <div className="relative bg-gradient-to-b from-[#2c1255] via-[#1e0940] to-[#170830] px-6 pt-5 pb-6 border-b border-[#2e1050]">
                        <span className="absolute top-4 left-10 text-amber-500/30 text-lg select-none">✦</span>
                        <span className="absolute top-3 right-12 text-amber-400/20 text-sm select-none">✦</span>

                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/25">
                                ✦ OFFICIAL ADMIT PASS
                            </span>
                            <span className="font-mono text-[10px] font-bold text-slate-400 tracking-wider">
                                {attendee.registration_id}
                            </span>
                        </div>

                        <div className="text-center space-y-1">
                            <h2
                                className="text-3xl font-black tracking-tight leading-none"
                                style={{
                                    background: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }}
                            >
                                NITTE&apos;S GOT LATENT
                            </h2>
                            <p className="text-[11px] text-slate-300 font-semibold">{settings.collegeName}</p>
                            <p className="text-[10px] text-amber-400/80 font-medium tracking-wider uppercase">{settings.department}</p>
                        </div>
                    </div>

                    {/* Perforated Divider */}
                    <div className="relative bg-[#120820] py-2">
                        <div className="absolute -left-3.5 -top-3.5 w-7 h-7 rounded-full bg-[#0c0516]" style={{ boxShadow: "inset 0 0 0 1.5px #3b1a6e" }} />
                        <div className="absolute -right-3.5 -top-3.5 w-7 h-7 rounded-full bg-[#0c0516]" style={{ boxShadow: "inset 0 0 0 1.5px #3b1a6e" }} />
                        <div className="border-t border-dashed border-[#3b1a6e]/60 mx-8" />
                    </div>

                    {/* Participant Info */}
                    <div className="px-5 pt-4 pb-5 space-y-4 bg-[#0f061e]">
                        <div className="bg-[#1a0c33] border border-[#2e1457] rounded-2xl divide-y divide-[#2b1450]">
                            <div className="px-4 py-3">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Name</p>
                                <p className="text-base font-black text-white leading-tight">{fullName}</p>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-[#2b1450]">
                                <div className="px-4 py-3">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">USN</p>
                                    <p className="font-mono text-sm font-extrabold text-amber-400">{attendee.usn || "—"}</p>
                                </div>
                                <div className="px-4 py-3">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Branch · Year</p>
                                    <p className="text-xs font-semibold text-slate-200 leading-snug">{attendee.branch || "CSE"}</p>
                                    {attendee.year && <p className="text-[10px] text-slate-400 mt-0.5">{attendee.year}</p>}
                                </div>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="flex flex-col items-center gap-2.5 py-1">
                            <div
                                className="p-4 bg-white rounded-2xl"
                                style={{ boxShadow: "0 0 0 3px rgba(251,191,36,0.4), 0 8px 30px rgba(251,191,36,0.15), 0 4px 20px rgba(0,0,0,0.5)" }}
                            >
                                {qrDataUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={qrDataUrl} alt="Official Entry QR Code" className="w-52 h-52 block rounded" />
                                ) : (
                                    <div className="w-52 h-52 bg-slate-100 flex items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] font-bold text-amber-400/90 tracking-[0.18em] uppercase">✦ Scan this QR at the entrance ✦</p>
                        </div>

                        {/* Footer bar */}
                        <div className="bg-[#1a0c33] border border-[#2e1457] rounded-xl px-4 py-3 flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-bold text-white truncate">{settings.date}</p>
                                    <p className="text-slate-400 text-[10px]">{settings.time}</p>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-[#2e1457] flex-shrink-0" />
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                <p className="font-semibold text-slate-200 truncate">{settings.venue}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleDownload} variant="primary" size="lg" fullWidth disabled={!qrDataUrl}>
                        <Download className="w-4 h-4" /> Download
                    </Button>
                    <Button onClick={handleShare} variant="secondary" size="lg" fullWidth>
                        <Share2 className="w-4 h-4" /> {copied ? "Copied!" : "Share Pass"}
                    </Button>
                </div>

                <div className="text-center pt-2">
                    <button onClick={() => window.print()} className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5">
                        <Printer className="w-4 h-4" /> Print Entry Ticket Pass
                    </button>
                </div>
            </div>
        </main>
    );
}
