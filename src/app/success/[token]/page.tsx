"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Share2 } from "lucide-react";
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
                    email: prev?.email || "",
                    phone: prev?.phone || "",
                    branch: json?.branch || prev?.branch || "Computer Science & Engineering (CSE)",
                    year: prev?.year || "3rd Year",
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
                    text: `Official Ticket Pass for ${attendee.first_name} (${attendee.registration_id})`,
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
            <div className="min-h-screen bg-[#08031a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-xs font-semibold">Generating your Official Digital Ticket Pass...</p>
                </div>
            </div>
        );
    }

    if (error || !attendee) {
        return (
            <div className="min-h-screen bg-[#08031a] flex items-center justify-center p-4">
                <div className="max-w-sm w-full text-center bg-[#150a29] border border-[#2e1457] rounded-3xl p-8 shadow-2xl">
                    <p className="text-red-400 font-bold text-lg mb-1">Pass Not Found</p>
                    <p className="text-slate-400 text-xs">{error}</p>
                    <Button onClick={() => router.push("/")} className="mt-6" fullWidth>Return to Registration</Button>
                </div>
            </div>
        );
    }

    const fullName = `${attendee.first_name} ${attendee.last_name}`.trim();
    const branchYear = [attendee.branch, attendee.year].filter(Boolean).join(" · ");

    return (
        <main className="min-h-screen bg-[#08031a] text-white py-6 px-4 flex flex-col items-center">
            {/* Outer wrapper */}
            <div className="w-full max-w-sm space-y-4">

                {/* ─── TICKET CARD ─── */}
                <div
                    className="relative rounded-[28px] overflow-hidden shadow-2xl shadow-purple-950"
                    style={{ boxShadow: "0 0 60px rgba(100,40,200,0.5)" }}
                >
                    {/* ══ TOP HALF — Purple curtain ══ */}
                    <div
                        className="relative overflow-hidden"
                        style={{
                            background: "linear-gradient(160deg, #2a0d6e 0%, #1a064a 40%, #3d1482 70%, #1a064a 100%)",
                        }}
                    >
                        {/* Curtain fold lines */}
                        {[...Array(10)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute inset-y-0 w-px opacity-20"
                                style={{
                                    left: `${(i + 1) * 10}%`,
                                    background: "linear-gradient(to bottom, transparent, rgba(80,20,160,0.8), transparent)",
                                }}
                            />
                        ))}

                        {/* Gold side tabs */}
                        <div className="absolute left-0 top-1/3 w-4 h-16 rounded-r-lg bg-gradient-to-b from-amber-400 to-amber-600 shadow-lg" />
                        <div className="absolute right-0 top-1/3 w-4 h-16 rounded-l-lg bg-gradient-to-b from-amber-400 to-amber-600 shadow-lg" />

                        {/* Vertical reg ID on left */}
                        <div
                            className="absolute left-5 inset-y-0 flex items-center justify-center"
                            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                        >
                            <span className="text-[9px] font-mono font-bold text-amber-300/80 tracking-widest uppercase">
                                {attendee.registration_id}
                            </span>
                        </div>

                        {/* Vertical year on right */}
                        <div
                            className="absolute right-5 inset-y-0 flex items-center justify-center"
                            style={{ writingMode: "vertical-rl" }}
                        >
                            <span className="text-[11px] font-black text-amber-400 tracking-widest">
                                2026
                            </span>
                        </div>

                        {/* Logos row */}
                        <div className="pt-5 pb-2 px-10 flex items-center justify-center gap-3">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-white/90 leading-tight tracking-wider">NITTE</p>
                                <p className="text-[7px] text-white/60 leading-none">(Deemed to be University)</p>
                            </div>
                            <div className="w-px h-6 bg-white/30" />
                            <div className="text-center">
                                <p className="text-[8px] font-bold text-white/90 leading-tight">NMAM INSTITUTE</p>
                                <p className="text-[8px] font-bold text-white/90 leading-tight">OF TECHNOLOGY</p>
                            </div>
                            <div className="w-px h-6 bg-white/30" />
                            <div>
                                <p className="text-[10px] font-black text-white/90 tracking-[0.2em]">VISTA</p>
                            </div>
                        </div>

                        {/* Main Title */}
                        <div className="px-10 pb-2 text-center">
                            <h1
                                className="text-5xl font-black leading-none tracking-tight"
                                style={{
                                    background: "linear-gradient(to bottom, #FFD700 0%, #FFA500 50%, #CC6600 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    textShadow: "none",
                                    filter: "drop-shadow(0 2px 8px rgba(255,165,0,0.4))",
                                }}
                            >
                                NITTE&apos;S GOT
                            </h1>
                            <h1
                                className="text-5xl font-black leading-none tracking-tight"
                                style={{
                                    background: "linear-gradient(to bottom, #FFD700 0%, #FFA500 50%, #CC6600 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    filter: "drop-shadow(0 2px 8px rgba(255,165,0,0.4))",
                                }}
                            >
                                LATENT
                            </h1>
                        </div>

                        {/* Official Admit Pass badge */}
                        <div className="pb-5 flex justify-center">
                            <div className="flex items-center gap-2 border border-amber-500/60 rounded-full px-4 py-1">
                                <span className="text-amber-400 text-xs">✦</span>
                                <span className="text-[10px] font-black text-amber-300 tracking-[0.15em] uppercase">Official Admit Pass</span>
                                <span className="text-amber-400 text-xs">✦</span>
                            </div>
                        </div>
                    </div>

                    {/* ══ PERFORATED DIVIDER ══ */}
                    <div className="relative bg-[#08031a] h-0">
                        {/* Left notch */}
                        <div className="absolute -left-3.5 -top-3.5 w-7 h-7 rounded-full bg-[#08031a]" />
                        {/* Right notch */}
                        <div className="absolute -right-3.5 -top-3.5 w-7 h-7 rounded-full bg-[#08031a]" />
                        {/* Dashed line */}
                        <div className="absolute inset-x-4 top-0 border-t-2 border-dashed border-[#2e1457]" />
                    </div>

                    {/* ══ BOTTOM HALF — Dark section ══ */}
                    <div className="bg-[#0d0520] px-6 pt-6 pb-5 space-y-5">
                        {/* Participant info box */}
                        <div className="bg-[#130930] border border-[#2b1458] rounded-2xl p-4">
                            <div className="flex gap-4">
                                {/* Left column */}
                                <div className="flex-1 min-w-0 space-y-3">
                                    <div>
                                        <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Participant Name</p>
                                        <p className="text-base font-black text-white truncate">{fullName}</p>
                                    </div>
                                    <div className="border-t border-[#2b1458] pt-2">
                                        <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">USN</p>
                                        <p className="text-sm font-extrabold text-white font-mono">{attendee.usn || "—"}</p>
                                    </div>
                                </div>
                                {/* Divider */}
                                <div className="w-px bg-[#2b1458]" />
                                {/* Right column */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Branch / Year</p>
                                    <p className="text-sm font-semibold text-white leading-tight">{branchYear || "—"}</p>
                                </div>
                            </div>
                        </div>

                        {/* QR section with side labels */}
                        <div className="relative flex items-center justify-center">
                            {/* Left rotated label */}
                            <div className="absolute left-0 flex flex-col items-center gap-1" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                                <span className="text-amber-400 text-xs">✦</span>
                                <span className="text-[9px] font-black text-white/80 uppercase tracking-[0.2em]">Scan This QR</span>
                                <span className="text-amber-400 text-xs">✦</span>
                            </div>

                            {/* QR Code */}
                            <div className="bg-white rounded-2xl p-3 shadow-xl" style={{ border: "3px solid rgba(251,191,36,0.5)" }}>
                                {qrDataUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={qrDataUrl} alt="Entry QR Code" className="w-44 h-44 rounded-sm" />
                                ) : (
                                    <div className="w-44 h-44 flex items-center justify-center bg-slate-100">
                                        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Right rotated label */}
                            <div className="absolute right-0 flex flex-col items-center gap-1" style={{ writingMode: "vertical-rl" }}>
                                <span className="text-amber-400 text-xs">✦</span>
                                <span className="text-[9px] font-black text-white/80 uppercase tracking-[0.2em]">At The Entrance</span>
                                <span className="text-amber-400 text-xs">✦</span>
                            </div>
                        </div>

                        {/* Footer bar */}
                        <div className="bg-[#130930] border border-[#2b1458] rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 text-[10px]">
                            <div>
                                <p className="font-black text-white">{settings.date?.toUpperCase()}</p>
                                <p className="text-slate-400 font-semibold">SATURDAY</p>
                            </div>
                            <div className="w-px h-8 bg-[#2b1458]" />
                            <div>
                                <p className="font-bold text-white text-center">{settings.venue?.toUpperCase()}</p>
                            </div>
                            <div className="w-px h-8 bg-[#2b1458]" />
                            <div className="text-right">
                                <p className="font-black text-amber-400">GET READY.</p>
                                <p className="text-slate-300 font-semibold">SHOW YOUR LATENT!</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pb-4">
                    <Button onClick={handleDownload} variant="primary" size="lg" fullWidth disabled={!qrDataUrl}>
                        <Download className="w-4 h-4" /> Download
                    </Button>
                    <Button onClick={handleShare} variant="secondary" size="lg" fullWidth>
                        <Share2 className="w-4 h-4" /> {copied ? "Copied!" : "Share Pass"}
                    </Button>
                </div>
            </div>
        </main>
    );
}
