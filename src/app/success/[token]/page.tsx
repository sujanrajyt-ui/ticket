"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Share2, Printer, CheckCircle2, MapPin, Calendar } from "lucide-react";
import { generateQRDataURL, downloadQRCode } from "@/lib/qr";
import { useEventConfig } from "@/components/EventConfigProvider";
import Button from "@/components/ui/Button";
import TieBreakerPollCard from "@/components/TieBreakerPollCard";

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

export default function SuccessPage() {
    const params = useParams<{ token: string }>();
    const router = useRouter();
    const { settings } = useEventConfig();
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const [attendee, setAttendee] = useState<AttendeeInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const token = params.token;
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
                        {/* Subtle sparkles */}
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
                        {/* Name + USN + Branch card */}
                        <div className="bg-[#1a0c33] border border-[#2e1457] rounded-2xl divide-y divide-[#2b1450]">
                            {/* Name row */}
                            <div className="px-4 py-3">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Name</p>
                                <p className="text-base font-black text-white leading-tight">{fullName}</p>
                            </div>
                            {/* USN + Branch row */}
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

                {/* Tie Breaker Voting Poll (Only renders for checked-in attendees) */}
                <TieBreakerPollCard token={params.token} />

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
