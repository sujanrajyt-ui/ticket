import { createAdminClient } from "@/lib/supabase/server";
import { lookupAttendee } from "@/lib/db";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, Hash, IdCard, Mail, Phone, User, Ticket } from "lucide-react";
import { getEventSettingsServer } from "@/lib/event-config";
import { format } from "date-fns";
import PollView from "@/components/PollView";

export default async function RegistrationViewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const settings = await getEventSettingsServer();

    let attendee = await lookupAttendee(id);

    if (!attendee) {
        try {
            const supabase = await createAdminClient();
            const { data } = await supabase
                .from("attendees")
                .select("*")
                .eq("registration_id", id)
                .maybeSingle();

            if (data) {
                attendee = data as unknown as typeof attendee;
            }
        } catch { /* ignored */ }
    }

    if (!attendee) notFound();

    const fullName = `${attendee.first_name} ${attendee.last_name}`.trim();
    const reggieDate = format(new Date(attendee.created_at), "dd MMMM yyyy, h:mm a");
    const checkinDate = attendee.checked_in_at
        ? format(new Date(attendee.checked_in_at), "dd MMMM yyyy, h:mm a")
        : null;

    return (
        <PollView token={id} attendeeFirstName={attendee.first_name}>
            <main className="min-h-screen bg-[#0c0516] text-white flex flex-col items-center justify-center p-4 py-8">
                <div className="max-w-sm w-full space-y-5">
                <div className="w-full bg-[#150a29] border-2 border-[#3b1a6e] rounded-3xl p-6 shadow-2xl space-y-5">
                    {/* Header */}
                    <div className="text-center space-y-1">
                        <div className="w-12 h-12 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mb-2">
                            <Ticket className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">{settings.name}</p>
                        <h1 className="text-xl font-black text-white">Registration Details</h1>
                    </div>

                    {/* Status banner */}
                    <div className={`rounded-2xl px-5 py-3.5 flex items-center gap-3 border ${attendee.checked_in
                        ? "bg-emerald-950/80 border-emerald-700"
                        : "bg-amber-500/10 border-amber-500/30"
                        }`}>
                        {attendee.checked_in ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                        ) : (
                            <Clock className="w-6 h-6 text-amber-400 flex-shrink-0" />
                        )}
                        <div>
                            <p className={`text-sm font-extrabold ${attendee.checked_in ? "text-emerald-300" : "text-amber-400"}`}>
                                {attendee.checked_in ? "CHECKED IN" : "REGISTERED PASS"}
                            </p>
                            {checkinDate && (
                                <p className="text-xs text-slate-300 mt-0.5">Checked in on {checkinDate}</p>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="bg-[#120721] border border-[#2b144e] rounded-2xl p-5 space-y-3.5">
                        {[
                            { icon: Hash, label: "Registration ID", value: attendee.registration_id },
                            { icon: User, label: "Name", value: fullName },
                            { icon: Mail, label: "Email", value: attendee.email },
                            { icon: Phone, label: "Phone", value: `+91 ${attendee.phone}` },
                            { icon: IdCard, label: "USN", value: attendee.usn || "Not provided" },
                            { icon: CalendarDays, label: "Registered On", value: reggieDate },
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
                        {checkinDate && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-in Time</p>
                                    <p className="text-sm text-white font-semibold">{checkinDate}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-center text-[11px] text-slate-400 font-medium">{settings.name} · {settings.date}</p>
                </div>
            </div>
            </main>
        </PollView>
    );
}

