import { createAdminClient } from "@/lib/supabase/server";
import { lookupAttendee } from "@/lib/db";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, IdCard, QrCode, Ticket } from "lucide-react";
import { getEventSettingsServer } from "@/lib/event-config";
import PollView from "@/components/PollView";

export default async function CheckInInfoPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const settings = await getEventSettingsServer();

    let attendee = await lookupAttendee(token);

    if (!attendee) {
        try {
            const supabase = await createAdminClient();
            const { data } = await supabase
                .from("attendees")
                .select("first_name, last_name, usn, registration_id, checked_in")
                .eq("qr_token", token)
                .maybeSingle();

            if (data) {
                attendee = data as unknown as typeof attendee;
            }
        } catch { /* ignored */ }
    }

    if (!attendee) notFound();

    return (
        <PollView token={token} attendeeFirstName={attendee.first_name}>
            <main className="min-h-screen bg-[#0c0516] text-white flex flex-col items-center justify-center p-4 py-8">
                <div className="max-w-sm w-full space-y-5">
                    <div className="w-full bg-[#150a29] border-2 border-[#3b1a6e] rounded-3xl p-6 shadow-2xl text-center space-y-5">
                    <div className="w-14 h-14 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400">
                        <Ticket className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">{settings.name}</p>
                        <h1 className="text-xl font-black text-white mt-1">
                            {`${attendee.first_name} ${attendee.last_name}`.trim()}
                        </h1>
                    </div>

                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold border ${attendee.checked_in
                        ? "bg-emerald-950/80 border-emerald-700 text-emerald-300"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        }`}>
                        {attendee.checked_in
                            ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> CHECKED IN</>
                            : <><Clock className="w-4 h-4 text-amber-400" /> REGISTERED PASS</>}
                    </div>

                    <div className="bg-[#120721] border border-[#2b144e] rounded-2xl p-4 text-left space-y-3 text-xs">
                        <div className="flex items-center gap-2.5">
                            <IdCard className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <span className="text-slate-400 font-medium">USN:</span>
                            <span className="text-amber-400 font-mono font-bold">{attendee.usn || "Not provided"}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <QrCode className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <span className="text-slate-400 font-medium">Reg ID:</span>
                            <span className="text-white font-mono">{attendee.registration_id}</span>
                        </div>
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium">
                        Show your QR code to the event volunteer at Sadananda Auditorium for check-in.
                    </p>
                </div>
            </div>
        </main>
        </PollView>
    );
}

