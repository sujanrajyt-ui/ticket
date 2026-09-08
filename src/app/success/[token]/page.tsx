"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Share2, Printer, CheckCircle2, MapPin, Calendar } from "lucide-react";
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
                try {
                    storedData = JSON.parse(stored);
                } catch {
                    /* load from lookup API fallback */
                }
            }

            let json: { found?: boolean; name?: string; usn?: string; registration_id?: string } | null = null;
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
                    branch: prev?.branch || "Computer Science & Engg",
                    year: prev?.year || "3rd Year",
                    created_at: prev?.created_at || new Date().toISOString(),
                }));
            } else if (json && !storedData) {
                setError("Ticket details not found.");
            }

            generateQRDataURL(token)
                .then((url) => {
                    if (!cancelled) setQrDataUrl(url);
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        })();

        return () => { cancelled = true; };
    }, [params.token]);

    const handleDownload = () => {
        if (qrDataUrl && attendee) {
            downloadQRCode(qrDataUrl, attendee.registration_id);
        }
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
                    <Button onClick={() => router.push("/")} className="mt-6" fullWidth>
                        Return to Registration
                    </Button>
                </div>
            </div>
        );
    }

    const fullName = `${attendee.first_name} ${attendee.last_name}`.trim();

    return (
        <main className="min-h-screen bg-[#0c0516] text-slate-100 py-8 px-4 sm:py-12">
            <div className="max-w-md mx-auto space-y-6 animate-fade-in">
                {/* Header Banner */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        REGISTRATION SUCCESSFUL
                    </div>
                    <h1 className="text-2xl font-black text-white">YOUR OFFICIAL ENTRY PASS</h1>
                    <p className="text-slate-400 text-xs">Present this pass on your screen at Sadananda Auditorium</p>
                </div>

                {/* ── TICKET PASS CARD ── */}
                <div className="bg-[#150a29] border-2 border-[#3b1a6e] rounded-3xl overflow-hidden shadow-2xl relative">
                    {/* Top Pass Header */}
                    <div className="bg-gradient-to-b from-[#240e47] to-[#170830] p-6 border-b border-[#301459] space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                                OFFICIAL ADMIT PASS
                            </span>
                            <span className="font-mono text-xs font-extrabold text-slate-300 tracking-wider">
                                #{attendee.registration_id}
                            </span>
                        </div>

                        <div className="pt-2 text-center">
                            <h2 className="text-2xl font-black text-amber-400 tracking-tight">
                                NITTE&apos;S GOT <span className="text-white">LATENT</span>
                            </h2>
                            <p className="text-xs text-slate-300 font-semibold">{settings.collegeName}</p>
                            <p className="text-[11px] text-amber-400/90 font-medium">{settings.department}</p>
                        </div>
                    </div>

                    {/* Perforated Divider */}
                    <div className="relative bg-[#150a29] py-1">
                        <div className="absolute -left-4 -top-3 w-6 h-6 rounded-full bg-[#0c0516] border border-[#3b1a6e]" />
                        <div className="absolute -right-4 -top-3 w-6 h-6 rounded-full bg-[#0c0516] border border-[#3b1a6e]" />
                        <div className="border-t-2 border-dashed border-[#301459] mx-6" />
                    </div>

                    {/* Participant Info */}
                    <div className="p-6 space-y-4">
                        <div className="bg-[#1d0e3b] border border-[#381a69] rounded-2xl p-4 space-y-2">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Participant Name</p>
                                <p className="text-lg font-extrabold text-white">{fullName}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#31165c] text-xs">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">USN</p>
                                    <p className="font-mono font-bold text-amber-400">{attendee.usn}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch / Year</p>
                                    <p className="font-medium text-slate-200 truncate">{attendee.branch || "CSE"}</p>
                                </div>
                            </div>
                        </div>

                        {/* HIGH-CONTRAST SOLID WHITE QR CONTAINER */}
                        <div className="text-center space-y-3 pt-2">
                            <div className="inline-block p-5 bg-white rounded-2xl shadow-xl border-4 border-amber-400/80">
                                {qrDataUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={qrDataUrl}
                                        alt="Official Entry QR Code"
                                        className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-md"
                                    />
                                ) : (
                                    <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto bg-slate-100 flex items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            <p className="text-xs font-bold text-amber-400 tracking-wider uppercase">
                                SCAN THIS QR AT THE ENTRANCE
                            </p>
                        </div>

                        {/* Venue & Time Footer */}
                        <div className="bg-[#120721] border border-[#2b144e] rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-300">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-amber-400" />
                                <span>{settings.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-amber-400" />
                                <span>{settings.venue}</span>
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
