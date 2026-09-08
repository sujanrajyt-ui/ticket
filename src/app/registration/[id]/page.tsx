import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, Hash, IdCard, Mail, Phone, User, XCircle } from "lucide-react";
import { getEventSettingsServer } from "@/lib/event-config";
import { format } from "date-fns";

import { Attendee } from "@/types/database";

export default async function RegistrationViewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createAdminClient();
    const settings = await getEventSettingsServer();

    const { data: rawAttendee, error } = await supabase
        .from("attendees")
        .select("*")
        .eq("registration_id", id)
        .single();

    const attendee = rawAttendee as unknown as Attendee | null;

    if (error || !attendee) notFound();

    const fullName = `${attendee.first_name} ${attendee.last_name}`;
    const reggieDate = format(new Date(attendee.created_at), "dd MMMM yyyy, h:mm a");
    const checkinDate = attendee.checked_in_at
        ? format(new Date(attendee.checked_in_at), "dd MMMM yyyy, h:mm a")
        : null;

    return (
        <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="max-w-sm w-full space-y-4 animate-fade-in">
                {/* Header */}
                <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-widest">{settings.name}</p>
                    <h1 className="text-xl font-bold text-white mt-1">Registration Details</h1>
                </div>

                {/* Status banner */}
                <div className={`rounded-2xl px-5 py-4 flex items-center gap-3 border ${attendee.checked_in
                    ? "bg-emerald-950/50 border-emerald-800"
                    : "bg-violet-950/50 border-violet-800"
                    }`}>
                    {attendee.checked_in ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    ) : (
                        <XCircle className="w-6 h-6 text-violet-400 flex-shrink-0" />
                    )}
                    <div>
                        <p className={`text-sm font-bold ${attendee.checked_in ? "text-emerald-400" : "text-violet-400"}`}>
                            {attendee.checked_in ? "CHECKED IN" : "REGISTERED"}
                        </p>
                        {checkinDate && (
                            <p className="text-xs text-gray-400 mt-0.5">Checked in on {checkinDate}</p>
                        )}
                    </div>
                </div>

                {/* Details */}
                <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4">
                    {[
                        { icon: Hash, label: "Registration ID", value: attendee.registration_id },
                        { icon: User, label: "Name", value: fullName },
                        { icon: Mail, label: "Email", value: attendee.email },
                        { icon: Phone, label: "Phone", value: `+91 ${attendee.phone}` },
                        { icon: IdCard, label: "USN", value: attendee.usn },
                        { icon: CalendarDays, label: "Registered On", value: reggieDate },
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
                    {checkinDate && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-950/50 border border-emerald-800/30 flex items-center justify-center flex-shrink-0">
                                <Clock className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Check-in Time</p>
                                <p className="text-sm text-white font-medium">{checkinDate}</p>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-gray-600">{settings.name} · {settings.date}</p>
            </div>
        </main>
    );
}
