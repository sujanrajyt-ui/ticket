import { redirect } from "next/navigation";

// This page handles QR code URLs embedded in the QR code
// e.g. https://your-domain.com/checkin/TOKEN
// When scanned by an attendee's camera app, it redirects to the registration view
// When scanned by the admin scanner, the scanner intercepts the URL itself

export default async function CheckInRedirectPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    // Attendees who scan their own QR are redirected to a lookup page
    // The actual check-in is done by the admin scanner via the /api/checkin route
    redirect(`/checkin-info/${token}`);
}
