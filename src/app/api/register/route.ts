import { NextRequest, NextResponse } from "next/server";
import { registerAttendee } from "@/lib/db";
import { generateQRToken, generateRegistrationId } from "@/lib/qr";
import { EVENT_CONFIG } from "@/config/event";
import { z } from "zod";

const registrationSchema = z.object({
    first_name: z.string().min(1, "First name is required").max(50),
    last_name: z.string().min(1, "Last name is required").max(50),
    email: z.string().email("Invalid email address"),
    phone: z
        .string()
        .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    usn: EVENT_CONFIG.usnRegex
        ? z
            .string()
            .regex(
                EVENT_CONFIG.usnRegex,
                "Invalid USN format. Example: 4NM22CS001"
            )
        : z.string().min(1, "USN is required"),
    branch: z.string().optional(),
    year: z.string().optional(),
});

// Simple in-memory rate limiter per IP
const ipRegistry = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = ipRegistry.get(ip);
    if (!entry || now > entry.resetAt) {
        ipRegistry.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            "unknown";
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: "Too many registration attempts. Please try again later." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const parsed = registrationSchema.safeParse(body);

        if (!parsed.success) {
            const errors: Record<string, string> = {};
            parsed.error.issues.forEach((e) => {
                if (e.path[0]) errors[e.path[0] as string] = e.message;
            });
            return NextResponse.json({ errors }, { status: 422 });
        }

        const data = parsed.data;
        const qrToken = generateQRToken();
        const registrationId = generateRegistrationId();

        const result = await registerAttendee({
            first_name: data.first_name.trim(),
            last_name: data.last_name.trim(),
            email: data.email.toLowerCase().trim(),
            phone: data.phone.trim(),
            usn: data.usn.toUpperCase().trim(),
            branch: data.branch || "Computer Science & Engg (CSE)",
            year: data.year || "3rd Year",
            qr_token: qrToken,
            registration_id: registrationId,
        });

        if (!result.success || !result.attendee) {
            if (result.duplicateField) {
                return NextResponse.json(
                    {
                        errors: {
                            [result.duplicateField]: result.error || "Details already registered.",
                        },
                        duplicate: true,
                    },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: result.error || "Registration failed. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                registration_id: result.attendee.registration_id,
                qr_token: result.attendee.qr_token,
                attendee: result.attendee,
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("Registration API error:", err);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
