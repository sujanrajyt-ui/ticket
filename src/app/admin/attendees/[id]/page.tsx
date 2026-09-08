"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, Clock, Hash, IdCard, Mail, Phone, User, RotateCcw, UserCheck } from "lucide-react";
import { Attendee } from "@/types/database";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";

export default function AttendeeDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [attendee, setAttendee] = useState<Attendee | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [showUndoModal, setShowUndoModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<"admin" | "volunteer" | null>(null);

    useEffect(() => {
        import("@/lib/supabase/client").then(({ createClient }) => {
            const supabase = createClient();
            supabase.auth.getUser().then(async ({ data: { user } }) => {
                if (!user) return;
                const { data: rawProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
                const profile = rawProfile as unknown as { role: "admin" | "volunteer" } | null;
                setUserRole(profile?.role || null);
            });
        });
    }, []);

    const fetchAttendee = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/attendees/${params.id}`);
            if (!res.ok) { setError("Attendee not found."); return; }
            const json = await res.json();
            setAttendee(json.attendee);
        } catch { setError("Could not load attendee."); } finally { setLoading(false); }
    };

    useEffect(() => { fetchAttendee(); }, [params.id]); // eslint-disable-line

    const handleManualCheckIn = async () => {
        if (!attendee) return;
        setActionLoading(true);
        try {
            // Use the lookup token to trigger the atomic check-in
            const res = await fetch("/api/checkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: attendee.qr_token }),
            });
            const json = await res.json();
            if (json.success) {
                setActionMsg("✓ Checked in successfully!");
                setShowCheckInModal(false);
                fetchAttendee();
            } else if (json.message === "ALREADY_CHECKED_IN") {
                setActionMsg("Already checked in.");
                setShowCheckInModal(false);
            } else {
                setActionMsg("Check-in failed. Please try again.");
            }
        } catch { setActionMsg("Network error."); } finally { setActionLoading(false); }
    };

    const handleUndoCheckIn = async () => {
        if (!attendee) return;
        setActionLoading(true);
        try {
            const res = await fetch("/api/checkin/undo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ registration_id: attendee.registration_id }),
            });
            if (res.ok) {
                setActionMsg("✓ Check-in undone.");
                setShowUndoModal(false);
                fetchAttendee();
            } else {
                setActionMsg("Failed to undo check-in.");
            }
        } catch { setActionMsg("Network error."); } finally { setActionLoading(false); }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error || !attendee) return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="text-center">
                <p className="text-red-400">{error}</p>
                <button onClick={() => router.back()} className="mt-4 text-violet-400 text-sm">← Go back</button>
            </div>
        </div>
    );

    const fullName = `${attendee.first_name} ${attendee.last_name}`.trim();
    const createdAt = format(new Date(attendee.created_at), "dd MMM yyyy, h:mm a");
    const checkedAt = attendee.checked_in_at
        ? format(new Date(attendee.checked_in_at), "dd MMM yyyy, h:mm a")
        : null;

    return (
        <div className="min-h-screen bg-gray-950 p-4">
            <div className="max-w-lg mx-auto animate-fade-in">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                {/* Status card */}
                <div className={`rounded-2xl px-5 py-4 flex items-center gap-4 mb-4 border ${attendee.checked_in ? "bg-emerald-950/50 border-emerald-800" : "bg-violet-950/50 border-violet-800"}`}>
                    {attendee.checked_in
                        ? <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                        : <Clock className="w-8 h-8 text-violet-400 flex-shrink-0" />}
                    <div>
                        <p className={`text-lg font-bold ${attendee.checked_in ? "text-emerald-400" : "text-violet-400"}`}>
                            {attendee.checked_in ? "CHECKED IN" : "REGISTERED"}
                        </p>
                        {checkedAt && <p className="text-xs text-gray-400 mt-0.5">Checked in on {checkedAt}</p>}
                    </div>
                    <div className="ml-auto">
                        <Badge variant={attendee.checked_in ? "success" : "info"} dot>
                            {attendee.checked_in ? "CHECKED IN" : "REGISTERED"}
                        </Badge>
                    </div>
                </div>

                {actionMsg && (
                    <div className="mb-4 bg-gray-800 border border-white/10 rounded-xl px-4 py-3">
                        <p className="text-sm text-gray-300">{actionMsg}</p>
                    </div>
                )}

                {/* Details */}
                <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4 mb-4">
                    {[
                        { icon: Hash, label: "Registration ID", value: attendee.registration_id },
                        { icon: User, label: "Name", value: fullName },
                        { icon: Mail, label: "Email", value: attendee.email },
                        { icon: Phone, label: "Phone", value: `+91 ${attendee.phone}` },
                        { icon: IdCard, label: "USN", value: attendee.usn },
                        { icon: Clock, label: "Registered At", value: createdAt },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-950/50 border border-violet-800/30 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-violet-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500">{label}</p>
                                <p className="text-sm text-white font-medium break-all">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions — admin only */}
                {userRole === "admin" && (
                    <div className="flex gap-3">
                        {!attendee.checked_in && (
                            <Button onClick={() => setShowCheckInModal(true)} fullWidth variant="primary">
                                <UserCheck className="w-4 h-4" />
                                Manual Check-In
                            </Button>
                        )}
                        {attendee.checked_in && (
                            <Button onClick={() => setShowUndoModal(true)} fullWidth variant="secondary">
                                <RotateCcw className="w-4 h-4" />
                                Undo Check-In
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Manual check-in confirm */}
            <Modal isOpen={showCheckInModal} onClose={() => setShowCheckInModal(false)} title="Confirm Manual Check-In">
                <p className="text-gray-300 text-sm mb-1">Are you sure you want to manually check in:</p>
                <p className="text-white font-semibold mb-1">{fullName}</p>
                <p className="text-gray-500 text-xs mb-5">{attendee.usn} · {attendee.registration_id}</p>
                <div className="flex gap-3">
                    <Button onClick={() => setShowCheckInModal(false)} variant="secondary" fullWidth>Cancel</Button>
                    <Button onClick={handleManualCheckIn} fullWidth loading={actionLoading}>Confirm Check-In</Button>
                </div>
            </Modal>

            {/* Undo check-in confirm */}
            <Modal isOpen={showUndoModal} onClose={() => setShowUndoModal(false)} title="Undo Check-In?">
                <p className="text-gray-300 text-sm mb-5">This will reset <span className="font-semibold text-white">{fullName}</span>&apos;s check-in status. Their entry record will be cleared.</p>
                <div className="flex gap-3">
                    <Button onClick={() => setShowUndoModal(false)} variant="secondary" fullWidth>Cancel</Button>
                    <Button onClick={handleUndoCheckIn} variant="danger" fullWidth loading={actionLoading}>Undo Check-In</Button>
                </div>
            </Modal>
        </div>
    );
}
