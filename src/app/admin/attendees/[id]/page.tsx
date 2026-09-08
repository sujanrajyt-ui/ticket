"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, Clock, Hash, IdCard, Mail, Phone, User, RotateCcw, UserCheck, Loader2 } from "lucide-react";
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
        <div className="min-h-screen bg-[#0c0516] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
    );

    if (error || !attendee) return (
        <div className="min-h-screen bg-[#0c0516] flex items-center justify-center p-4">
            <div className="text-center bg-[#150a29] border border-[#2e1457] p-8 rounded-3xl max-w-sm w-full">
                <p className="text-red-400 font-bold">{error}</p>
                <button onClick={() => router.back()} className="mt-4 text-amber-400 hover:underline text-sm font-semibold">← Go back</button>
            </div>
        </div>
    );

    const fullName = `${attendee.first_name} ${attendee.last_name}`.trim();
    const createdAt = format(new Date(attendee.created_at), "dd MMM yyyy, h:mm a");
    const checkedAt = attendee.checked_in_at
        ? format(new Date(attendee.checked_in_at), "dd MMM yyyy, h:mm a")
        : null;

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDelete = async () => {
        if (!attendee) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/attendees/${attendee.registration_id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setActionMsg("✓ Registration deleted permanently.");
                setShowDeleteModal(false);
                setTimeout(() => router.push("/admin"), 1000);
            } else {
                setActionMsg("Failed to delete attendee.");
            }
        } catch { setActionMsg("Network error during deletion."); } finally { setActionLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#0c0516] text-white">
            <header className="border-b border-[#241047] bg-[#120721] sticky top-0 z-20 shadow-md sticky-safe">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <span className="text-amber-400 font-mono text-xs font-bold">{attendee.registration_id}</span>
                </div>
            </header>

            <main className="max-w-lg mx-auto p-4 space-y-4">
                {/* Status card */}
                <div className={`rounded-3xl p-5 flex items-center gap-4 border shadow-xl ${attendee.checked_in ? "bg-emerald-950/80 border-emerald-700" : "bg-[#150a29] border-[#3b1a6e]"}`}>
                    {attendee.checked_in
                        ? <CheckCircle2 className="w-9 h-9 text-emerald-400 flex-shrink-0" />
                        : <Clock className="w-9 h-9 text-amber-400 flex-shrink-0" />}
                    <div>
                        <p className={`text-lg font-black tracking-wide ${attendee.checked_in ? "text-emerald-300" : "text-amber-400"}`}>
                            {attendee.checked_in ? "CHECKED IN" : "REGISTERED"}
                        </p>
                        {checkedAt && <p className="text-xs text-slate-300 mt-0.5 font-medium">Checked in on {checkedAt}</p>}
                    </div>
                    <div className="ml-auto">
                        <Badge variant={attendee.checked_in ? "success" : "gold"} dot>
                            {attendee.checked_in ? "CHECKED IN" : "REGISTERED"}
                        </Badge>
                    </div>
                </div>

                {actionMsg && (
                    <div className="bg-[#150a29] border border-amber-500/30 rounded-2xl px-4 py-3">
                        <p className="text-xs text-amber-300 font-semibold">{actionMsg}</p>
                    </div>
                )}

                {/* Details */}
                <div className="bg-[#150a29] border-2 border-[#3b1a6e] rounded-3xl p-6 space-y-4 shadow-xl">
                    {[
                        { icon: Hash, label: "Registration ID", value: attendee.registration_id },
                        { icon: User, label: "Name", value: fullName },
                        { icon: Mail, label: "Email", value: attendee.email },
                        { icon: Phone, label: "Phone", value: `+91 ${attendee.phone}` },
                        { icon: IdCard, label: "USN / Student ID", value: attendee.usn || "Not provided" },
                        { icon: IdCard, label: "Branch", value: attendee.branch || "Computer Science & Engg (CSE)" },
                        { icon: Clock, label: "Academic Year", value: attendee.year || "3rd Year" },
                        { icon: Clock, label: "Registered At", value: createdAt },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400">
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                                <p className="text-sm text-white font-semibold break-all">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions — admin only */}
                {userRole === "admin" && (
                    <div className="flex flex-col gap-3 pt-2">
                        <div className="flex gap-3">
                            {!attendee.checked_in && (
                                <Button onClick={() => setShowCheckInModal(true)} fullWidth variant="primary" size="lg">
                                    <UserCheck className="w-4 h-4" />
                                    Manual Check-In
                                </Button>
                            )}
                            {attendee.checked_in && (
                                <Button onClick={() => setShowUndoModal(true)} fullWidth variant="secondary" size="lg">
                                    <RotateCcw className="w-4 h-4" />
                                    Undo Check-In
                                </Button>
                            )}
                        </div>
                        <Button onClick={() => setShowDeleteModal(true)} fullWidth variant="danger" size="lg">
                            Delete Registration
                        </Button>
                    </div>
                )}
            </main>

            {/* Manual check-in confirm */}
            <Modal isOpen={showCheckInModal} onClose={() => setShowCheckInModal(false)} title="Confirm Manual Check-In">
                <p className="text-slate-300 text-sm mb-1">Are you sure you want to manually check in:</p>
                <p className="text-white font-extrabold text-base mb-1">{fullName}</p>
                <p className="text-slate-400 text-xs mb-5 font-mono">{attendee.usn} · #{attendee.registration_id}</p>
                <div className="flex gap-3">
                    <Button onClick={() => setShowCheckInModal(false)} variant="secondary" fullWidth>Cancel</Button>
                    <Button onClick={handleManualCheckIn} fullWidth loading={actionLoading}>Confirm Check-In</Button>
                </div>
            </Modal>

            {/* Undo check-in confirm */}
            <Modal isOpen={showUndoModal} onClose={() => setShowUndoModal(false)} title="Undo Check-In?">
                <p className="text-slate-300 text-sm mb-5">This will reset <span className="font-bold text-white">{fullName}</span>&apos;s check-in status. Their entry record will be cleared.</p>
                <div className="flex gap-3">
                    <Button onClick={() => setShowUndoModal(false)} variant="secondary" fullWidth>Cancel</Button>
                    <Button onClick={handleUndoCheckIn} variant="danger" fullWidth loading={actionLoading}>Undo Check-In</Button>
                </div>
            </Modal>

            {/* Delete entry confirm */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Registration Permanently?">
                <p className="text-slate-300 text-sm mb-1">Are you sure you want to delete <span className="font-bold text-white">{fullName}</span>?</p>
                <p className="text-red-400 text-xs mb-5 font-semibold">⚠️ This action cannot be undone. The ticket pass will become invalid.</p>
                <div className="flex gap-3">
                    <Button onClick={() => setShowDeleteModal(false)} variant="secondary" fullWidth>Cancel</Button>
                    <Button onClick={handleDelete} variant="danger" fullWidth loading={actionLoading}>Permanently Delete</Button>
                </div>
            </Modal>
        </div>
    );
}

