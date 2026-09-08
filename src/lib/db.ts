import { Attendee } from "@/types/database";
import { createAdminClient } from "./supabase/server";

// Global in-memory storage for local demo / preview mode when Supabase is unconfigured
const globalMockStore = globalThis as unknown as {
    mockAttendees?: Attendee[];
};

if (!globalMockStore.mockAttendees) {
    globalMockStore.mockAttendees = [];
}

export const mockAttendees = globalMockStore.mockAttendees;

export function isMockMode(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return !url || url.includes("placeholder.supabase.co");
}

export async function registerAttendee(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    usn: string;
    branch?: string;
    year?: string;
    qr_token: string;
    registration_id: string;
}): Promise<{ success: boolean; attendee?: Attendee; error?: string; duplicateField?: string }> {
    if (isMockMode()) {
        const existingEmail = mockAttendees.find((a) => a.email.toLowerCase() === data.email.toLowerCase());
        if (existingEmail) return { success: false, duplicateField: "email", error: "This email address is already registered." };

        const existingPhone = mockAttendees.find((a) => a.phone === data.phone);
        if (existingPhone) return { success: false, duplicateField: "phone", error: "This phone number is already registered." };

        const existingUsn = mockAttendees.find((a) => a.usn.toUpperCase() === data.usn.toUpperCase());
        if (existingUsn) return { success: false, duplicateField: "usn", error: "This USN is already registered." };

        const newAttendee: Attendee = {
            id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            registration_id: data.registration_id,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            usn: data.usn,
            branch: data.branch || "Computer Science & Engg (CSE)",
            year: data.year || "3rd Year",
            qr_token: data.qr_token,
            checked_in: false,
            checked_in_at: null,
            created_at: new Date().toISOString(),
        };

        mockAttendees.unshift(newAttendee);
        return { success: true, attendee: newAttendee };
    }

    try {
        const supabase = await createAdminClient();

        const { data: existingEmail } = await supabase
            .from("attendees")
            .select("id")
            .eq("email", data.email.toLowerCase())
            .maybeSingle();

        if (existingEmail) return { success: false, duplicateField: "email", error: "This email address is already registered." };

        const { data: existingPhone } = await supabase
            .from("attendees")
            .select("id")
            .eq("phone", data.phone)
            .maybeSingle();

        if (existingPhone) return { success: false, duplicateField: "phone", error: "This phone number is already registered." };

        const { data: existingUsn } = await supabase
            .from("attendees")
            .select("id")
            .eq("usn", data.usn.toUpperCase())
            .maybeSingle();

        if (existingUsn) return { success: false, duplicateField: "usn", error: "This USN is already registered." };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rawAttendee, error: insertError } = await (supabase.from("attendees") as any)
            .insert({
                registration_id: data.registration_id,
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email.toLowerCase(),
                phone: data.phone,
                usn: data.usn.toUpperCase(),
                branch: data.branch,
                year: data.year,
                qr_token: data.qr_token,
                checked_in: false,
                checked_in_at: null,
            })
            .select()
            .single();

        if (insertError || !rawAttendee) {
            console.error("Supabase insert error:", insertError);
            return { success: false, error: "Database error during registration." };
        }

        return { success: true, attendee: rawAttendee as unknown as Attendee };
    } catch (err) {
        console.warn("Supabase fallback to mock mode due to error:", err);
        const newAttendee: Attendee = {
            id: `mock-${Date.now()}`,
            registration_id: data.registration_id,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            usn: data.usn,
            branch: data.branch || "Computer Science & Engg (CSE)",
            year: data.year || "3rd Year",
            qr_token: data.qr_token,
            checked_in: false,
            checked_in_at: null,
            created_at: new Date().toISOString(),
        };
        mockAttendees.unshift(newAttendee);
        return { success: true, attendee: newAttendee };
    }
}

export async function lookupAttendee(token: string): Promise<Attendee | null> {
    const mockMatch = mockAttendees.find(
        (a) => a.qr_token === token || a.registration_id === token
    );
    if (mockMatch) return mockMatch;

    if (isMockMode()) return null;

    try {
        const supabase = await createAdminClient();
        const { data } = await supabase
            .from("attendees")
            .select("*")
            .or(`qr_token.eq.${token},registration_id.eq.${token}`)
            .maybeSingle();

        return (data as unknown as Attendee) || null;
    } catch {
        return null;
    }
}

export async function checkInAttendee(token: string): Promise<{ success: boolean; message: string; attendee?: Attendee }> {
    const mockMatch = mockAttendees.find(
        (a) => a.qr_token === token || a.registration_id === token
    );

    if (mockMatch || isMockMode()) {
        if (!mockMatch) return { success: false, message: "INVALID_TOKEN" };
        if (mockMatch.checked_in) return { success: false, message: "ALREADY_CHECKED_IN", attendee: mockMatch };

        mockMatch.checked_in = true;
        mockMatch.checked_in_at = new Date().toISOString();
        return { success: true, message: "SUCCESS", attendee: mockMatch };
    }

    try {
        const supabase = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc("check_in_attendee", { p_token: token });

        if (error) {
            console.error("Check-in RPC error:", error);
            return { success: false, message: "RPC_ERROR" };
        }

        const res = data as unknown as { success: boolean; message: string; attendee_data?: Attendee };
        return {
            success: res?.success || false,
            message: res?.message || "ERROR",
            attendee: res?.attendee_data,
        };
    } catch {
        return { success: false, message: "NETWORK_ERROR" };
    }
}

export async function getAttendees(search = "", filter = "all"): Promise<{ attendees: Attendee[]; total: number }> {
    let list = [...mockAttendees];

    if (!isMockMode()) {
        try {
            const supabase = await createAdminClient();
            let query = supabase.from("attendees").select("*");
            if (filter === "checked_in") query = query.eq("checked_in", true);
            if (filter === "not_checked_in") query = query.eq("checked_in", false);
            if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,usn.ilike.%${search}%,registration_id.ilike.%${search}%`);

            const { data } = await query;
            if (data && data.length > 0) {
                list = data as unknown as Attendee[];
            }
        } catch { /* use mockList */ }
    }

    let filtered = list;
    if (filter === "checked_in") filtered = filtered.filter((a) => a.checked_in);
    if (filter === "not_checked_in") filtered = filtered.filter((a) => !a.checked_in);

    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
            (a) =>
                a.first_name.toLowerCase().includes(s) ||
                a.last_name.toLowerCase().includes(s) ||
                a.email.toLowerCase().includes(s) ||
                a.usn.toLowerCase().includes(s) ||
                a.registration_id.toLowerCase().includes(s)
        );
    }

    return { attendees: filtered, total: filtered.length };
}
