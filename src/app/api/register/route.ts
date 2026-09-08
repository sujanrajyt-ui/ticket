import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
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
                "Invalid USN format. Example: 1RV22CS001"
            )
        : z.string().min(1, "USN is required"),
});

// Simple in-memory rate limiter per IP (resets on every cold start)
const ipRegistry = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // 5 registrations per IP per window
const WINDOW_MS = 60 * 1000; // 1 minute

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
        // Rate limiting
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
        const supabase = await createAdminClient();

        // Duplicate checks
        const duplicateChecks: { field: string; value: string; label: string }[] =
            [];

        if (EVENT_CONFIG.checkDuplicateEmail)
            duplicateChecks.push({
                field: "email",
                value: data.email.toLowerCase(),
                label: "email address",
            });
        if (EVENT_CONFIG.checkDuplicatePhone)
            duplicateChecks.push({
                field: "phone",
                value: data.phone,
                label: "phone number",
            });
        if (EVENT_CONFIG.checkDuplicateUsn)
            duplicateChecks.push({
                field: "usn",
                value: data.usn.toUpperCase(),
                label: "USN",
            });

        for (const check of duplicateChecks) {
            const { data: existing, error } = await supabase
                .from("attendees")
                .select("id")
                .eq(check.field, check.value)
                .maybeSingle();

            if (error) {
                console.error("Duplicate check error:", error);
                return NextResponse.json(
                    { error: "Database error. Please try again." },
                    { status: 500 }
                );
            }

            if (existing) {
                return NextResponse.json(
                    {
                        errors: {
                            [check.field]: `This ${check.label} is already registered.`,
                        },
                        duplicate: true,
                    },
                    { status: 409 }
                );
            }
        }

        // Generate unique tokens
        const qrToken = generateQRToken();
        const registrationId = generateRegistrationId();

        // Insert attendee
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rawAttendee, error: insertError } = await (supabase.from("attendees") as any)
            .insert({
                registration_id: registrationId,
                first_name: data.first_name.trim(),
                last_name: data.last_name.trim(),
                email: data.email.toLowerCase().trim(),
                phone: data.phone.trim(),
                usn: data.usn.toUpperCase().trim(),
                qr_token: qrToken,
                checked_in: false,
                checked_in_at: null,
            })
            .select()
            .single();

        const attendee = rawAttendee as unknown as {
            registration_id: string;
            qr_token: string;
            first_name: string;
            last_name: string;
            email: string;
            phone: string;
            usn: string;
            created_at: string;
        } | null;

        if (insertError || !attendee) {
            console.error("Insert error:", insertError);
            // Handle unique constraint violations gracefully
            if (insertError?.code === "23505") {
                return NextResponse.json(
                    {
                        error:
                            "A registration with these details already exists. Please check your information.",
                        duplicate: true,
                    },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: "Registration failed. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                registration_id: attendee.registration_id,
                qr_token: attendee.qr_token,
                attendee: {
                    first_name: attendee.first_name,
                    last_name: attendee.last_name,
                    email: attendee.email,
                    phone: attendee.phone,
                    usn: attendee.usn,
                    registration_id: attendee.registration_id,
                    created_at: attendee.created_at,
                },
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
