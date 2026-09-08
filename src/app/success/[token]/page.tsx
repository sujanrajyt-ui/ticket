"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Eye, CheckCircle2, User, Mail, Phone, Hash, IdCard } from "lucide-react";
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

    useEffect(() => {
        const token = params.token;
        if (!token) {
            setError("Invalid link.");
            setLoading(false);
            return;
        }

        // Load from sessionStorage (set at registration time)
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Loading your registration...</p>
                </div>
            </div>
        );
    }

    if (error || !attendee) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="max-w-sm w-full text-center bg-gray-900 border border-red-900 rounded-2xl p-8">
                    <p className="text-red-400 font-semibold text-lg mb-2">Oops!</p>
                    <p className="text-gray-400 text-sm">{error}</p>
                    <Button onClick={() => router.push("/")} className="mt-6" fullWidth>
                        Go Back Home
                    </Button>
                </div>
            </div>
        );
    }

    const fullName = `${attendee.first_name} ${attendee.last_name}`;
    const reggieDate = new Date(attendee.created_at).toLocaleString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    return (
        <main className="min-h-screen bg-gray-950 relative overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-900/15 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-lg mx-auto px-4 py-8 sm:py-12 animate-fade-in">
                {/* Success header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Registration Successful!</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Welcome, <span className="text-white font-semibold">{fullName}</span>!
                    </p>
                    <p className="text-gray-500 text-xs mt-1">Your registration has been confirmed.</p>
                </div>

                {/* QR Code card */}
                <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 text-center mb-5 shadow-xl">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
                        Your Entry QR Code
                    </p>
                    {qrDataUrl ? (
                        <div className="flex justify-center mb-5">
                            <div className="p-4 bg-white rounded-2xl inline-block shadow-lg">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={qrDataUrl}
                                    alt="Registration QR Code"
                                    className="w-56 h-56 sm:w-64 sm:h-64"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="w-56 h-56 sm:w-64 sm:h-64 mx-auto bg-gray-800 rounded-2xl flex items-center justify-center mb-5">
                            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                    <p className="text-xs text-gray-500 mb-1">
                        Show this QR at the event entrance
                    </p>
                    <p className="text-xs text-gray-600">{EVENT_CONFIG.name} · {EVENT_CONFIG.date}</p>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <Button
                        onClick={handleDownload}
                        variant="primary"
                        size="md"
                        fullWidth
                        disabled={!qrDataUrl}
                    >
                        <Download className="w-4 h-4" />
                        Download QR
                    </Button>
                    <Button
                        onClick={() => router.push(`/registration/${attendee.registration_id}`)}
                        variant="secondary"
                        size="md"
                        fullWidth
                    >
                        <Eye className="w-4 h-4" />
                        View Details
                    </Button>
                </div>

                {/* Registration details */}
                <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Registration Details</h3>
                    {[
                        { icon: Hash, label: "Registration ID", value: attendee.registration_id },
                        { icon: User, label: "Name", value: fullName },
                        { icon: Mail, label: "Email", value: attendee.email },
                        { icon: Phone, label: "Phone", value: `+91 ${attendee.phone}` },
                        { icon: IdCard, label: "USN", value: attendee.usn },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-950/50 border border-violet-800/30 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-violet-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500">{label}</p>
                                <p className="text-sm text-white font-medium truncate">{value}</p>
                            </div>
                        </div>
                    ))}
                    <div className="pt-2 border-t border-white/5">
                        <p className="text-xs text-gray-500">Registered on {reggieDate}</p>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-600 mt-6">
                    Save or screenshot your QR code — you&apos;ll need it at the entrance.
                </p>
            </div>
        </main>
    );
}
