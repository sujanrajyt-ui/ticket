import QRCode from "qrcode";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Generates a QR code as a data URL (PNG).
 * The QR code encodes the check-in URL — no PII inside.
 */
export async function generateQRDataURL(qrToken: string): Promise<string> {
    const checkInUrl = `${APP_URL}/checkin/${qrToken}`;
    return QRCode.toDataURL(checkInUrl, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 400,
        color: {
            dark: "#1e1b4b",  // Indigo-950
            light: "#ffffff",
        },
    });
}

/**
 * Downloads the QR code as a PNG file.
 * Called client-side only.
 */
export function downloadQRCode(dataUrl: string, registrationId: string) {
    const link = document.createElement("a");
    link.download = `qr-${registrationId}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Generates a secure unique QR token.
 * Uses crypto.randomUUID() on server and client.
 */
export function generateQRToken(): string {
    // crypto.randomUUID is available in Node 14.17+ and all modern browsers
    const uuid = crypto.randomUUID();
    // Base64url-encode to make it slightly shorter and URL-safe
    return uuid.replace(/-/g, "");
}

/**
 * Generates a friendly registration ID like REG-20251115-ABCD1234
 */
export function generateRegistrationId(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `REG-${dateStr}-${random}`;
}
