import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, IdCard, QrCode } from "lucide-react";
import { getEventSettingsServer } from "@/lib/event-config";

export default async function CheckInInfoPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const supabase = await createAdminClient();
    const settings = await getEventSettingsServer();

    const { data: rawAttendee } = await supabase
        .from("attendees")
        .select("first_name, last_name, usn, registration_id, checked_in")
        .eq("qr_token", token)
        .single();

    const attendee = rawAttendee as unknown as {
        first_name: string;
        last_name: string;
        usn: string;
        registration_id: string;
        checked_in: boolean;
    } | null;

    if (!attendee) notFound();

    return (
        <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="max-w-xs w-full text-center space-y-4">
                <div className="w-14 h-14 mx-auto bg-violet-950 border border-violet-800 rounded-2xl flex items-center justify-center">
                    <QrCode className="w-7 h-7 text-violet-400" />
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">{settings.name}</p>
                <h1 className="text-xl font-bold text-white">
                    {`${attendee.first_name} ${attendee.last_name}`.trim()}
                </h1>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${attendee.checked_in
                    ? "bg-emerald-950 border-emerald-800 text-emerald-400"
                    : "bg-violet-950 border-violet-800 text-violet-400"
                    }`}>
                    {attendee.checked_in
                        ? <><CheckCircle2 className="w-4 h-4" /> Checked In</>
                        : <><Clock className="w-4 h-4" /> Registered</>}
                </div>
                <div className="bg-gray-900 border border-white/10 rounded-xl p-4 text-left space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                        <IdCard className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400">USN:</span>
                        <span className="text-white font-mono">{attendee.usn}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400">ID:</span>
                        <span className="text-white font-mono text-xs">{attendee.registration_id}</span>
                    </div>
                </div>
                <p className="text-xs text-gray-600">
                    Show your QR code to the event volunteer for check-in.
                </p>
            </div>
        </main>
    );
}
