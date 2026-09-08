"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Eye, CheckCircle2, User, Mail, Phone, Hash, IdCard, CalendarDays, MapPin, Clock, Sparkles, Printer, Share2 } from "lucide-react";
import { generateQRDataURL, downloadQRCode } from "@/lib/qr";
import { EVENT_CONFIG } from "@/config/event";
import Button from "@/components/ui/Button";

interface AttendeeInfo {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    usn: string;
    registration_id: string;
    created_at: string;
}

export default function SuccessPage() {
    const params = useParams<{ token: string }>();
    const router = useRouter();
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const [attendee, setAttendee] = useState<AttendeeInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const token = params.token;
        if (!token) {
            setError("Invalid link.");
            setLoading(false);
            return;
        }

        const stored = sessionStorage.getItem(`reg_${token}`);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setAttendee(data);
            } catch {
                setError("Could not load registration details.");
                setLoading(false);
                return;
            }
        } else {
            setError("Registration details not found. Please register again.");
            setLoading(false);
            return;
        }

        generateQRDataURL(token)
            .then(setQrDataUrl)
            .catch(() => setError("Could not generate QR code."))
            .finally(() => setLoading(false));
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
                    title: `${EVENT_CONFIG.name} Ticket Pass`,
                    text: `Here is my registration pass for ${EVENT_CONFIG.name} (${attendee.registration_id})`,
                    url: window.location.href,
                });
            } catch {
                /* share cancelled */
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm font-medium">Generating your QR Sage Ticket Pass...</p>
                </div>
            </div>
        );
    }

    if (error || !attendee) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="max-w-sm w-full text-center bg-gray-900 border border-red-900/50 rounded-3xl p-8 shadow-2xl">
                    <p className="text-red-400 font-semibold text-lg mb-2">Registration Not Found</p>
                    <p className="text-gray-400 text-sm">{error}</p>
                    <Button onClick={() => router.push("/")} className="mt-6" fullWidth>
                        Go Back to Registration
                    </Button>
                </div>
            </div>
        );
    }

    const fullName = `${attendee.first_name} ${attendee.last_name}`;
    const reggieDate = new Date(attendee.created_at).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    return (
        <main className="min-h-screen bg-gray-950 text-white relative overflow-x-hidden py-8 px-4 sm:py-12">
            {/* Background ambient lighting */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-md mx-auto animate-fade-in">
                {/* Top Success Badge */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 shadow-lg shadow-emerald-950/50">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        REGISTRATION CONFIRMED
                    </div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Your Event Ticket Pass</h1>
                    <p className="text-gray-400 text-xs mt-1">Show this digital QR pass at the event check-in kiosk</p>
                </div>

                {/* ── DIGITAL TICKET PASS CARD (QR-SAGE STYLE) ── */}
                <div className="bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">

                    {/* Ticket Header Section */}
                    <div className="bg-gradient-to-br from-violet-950 via-purple-900 to-slate-900 p-6 relative border-b border-white/10">
                        {/* Top row badge & ID */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-bold tracking-widest text-white uppercase">ADMIT PASS</span>
                            </div>
                            <span className="font-mono text-xs font-bold text-violet-300 tracking-wider">
                                {attendee.registration_id}
                            </span>
                        </div>

                        {/* Event Title */}
                        <h2 className="text-2xl font-extrabold text-white tracking-tight mb-1 leading-snug">
                            {EVENT_CONFIG.name}
                        </h2>
                        <p className="text-xs text-violet-200/80 font-medium">{EVENT_CONFIG.tagline}</p>

                        {/* Date / Time / Venue quick bar */}
                        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs text-white/80">
                            <div className="flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                <span className="truncate">{EVENT_CONFIG.date}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                <span className="truncate">{EVENT_CONFIG.time}</span>
                            </div>
                            <div className="col-span-2 flex items-center gap-1.5 mt-1 text-white/70">
                                <MapPin className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                <span className="truncate">{EVENT_CONFIG.venue}</span>
                            </div>
                        </div>
                    </div>

                    {/* Perforated Cutout Line (Ticket Stub Notch) */}
                    <div className="relative bg-gray-900 py-2">
                        <div className="absolute -left-4 -top-3.5 w-7 h-7 rounded-full bg-gray-950 border border-white/10" />
                        <div className="absolute -right-4 -top-3.5 w-7 h-7 rounded-full bg-gray-950 border border-white/10" />
                        <div className="border-t-2 border-dashed border-white/10 mx-6" />
                    </div>

                    {/* QR Code Center Stage */}
                    <div className="px-6 pt-2 pb-6 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.25em] mb-4">
                            ENTRY QR CODE
                        </p>

                        {qrDataUrl ? (
                            <div className="inline-block relative p-4 bg-white rounded-2xl shadow-xl shadow-violet-950/40 border-2 border-violet-500/20 group">
                                {/* Scanner viewfinder corners overlay */}
                                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-violet-600" />
                                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-violet-600" />
                                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-violet-600" />
                                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-violet-600" />

                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={qrDataUrl}
                                    alt="Entry QR Code"
                                    className="w-52 h-52 sm:w-60 sm:h-60 mx-auto"
                                />
                            </div>
                        ) : (
                            <div className="w-52 h-52 sm:w-60 sm:h-60 mx-auto bg-gray-800 rounded-2xl flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}

                        <p className="text-xs text-gray-400 font-medium mt-4 flex items-center justify-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                            Scan at Entrance for Instant Access
                        </p>
                    </div>

                    {/* Attendee Info Stub */}
                    <div className="bg-gray-950/60 border-t border-white/10 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">PASS HOLDER</span>
                            <span className="text-xs font-semibold text-white">{fullName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">USN</span>
                            <span className="text-xs font-mono font-medium text-violet-300">{attendee.usn}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">MOBILE</span>
                            <span className="text-xs text-gray-300">+91 {attendee.phone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">ISSUED ON</span>
                            <span className="text-xs text-gray-400">{reggieDate}</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <Button
                        onClick={handleDownload}
                        variant="primary"
                        size="lg"
                        fullWidth
                        disabled={!qrDataUrl}
                        className="shadow-lg shadow-violet-900/30"
                    >
                        <Download className="w-4 h-4" />
                        Download Ticket
                    </Button>

                    <Button
                        onClick={handleShare}
                        variant="secondary"
                        size="lg"
                        fullWidth
                    >
                        <Share2 className="w-4 h-4" />
                        {copied ? "Link Copied!" : "Share Pass"}
                    </Button>
                </div>

                {/* Secondary actions */}
                <div className="flex justify-between items-center mt-4 px-2 text-xs">
                    <button
                        onClick={() => window.print()}
                        className="text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                        <Printer className="w-3.5 h-3.5" /> Print Ticket
                    </button>

                    <button
                        onClick={() => router.push(`/registration/${attendee.registration_id}`)}
                        className="text-violet-400 hover:text-violet-300 flex items-center gap-1.5 transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5" /> Full Registration Details
                    </button>
                </div>

                <p className="text-center text-xs text-gray-600 mt-6">
                    {EVENT_CONFIG.name} · Powered by QR Sage Check-in System
                </p>
            </div>
        </main>
    );
}
