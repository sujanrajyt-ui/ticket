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
    const cleanEmail = data.email.toLowerCase().trim();
    const cleanPhone = data.phone.trim();
    const cleanUsn = data.usn ? data.usn.trim().toUpperCase() : "";

    if (isMockMode()) {
        const existingEmail = mockAttendees.find((a) => a.email.toLowerCase() === cleanEmail);
        if (existingEmail) return { success: false, duplicateField: "email", error: "This email address is already registered." };

        const existingPhone = mockAttendees.find((a) => a.phone === cleanPhone);
        if (existingPhone) return { success: false, duplicateField: "phone", error: "This phone number is already registered." };

        if (cleanUsn) {
            const existingUsn = mockAttendees.find((a) => a.usn && a.usn.toUpperCase() === cleanUsn);
            if (existingUsn) return { success: false, duplicateField: "usn", error: "This USN is already registered." };
        }

        const newAttendee: Attendee = {
            id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            registration_id: data.registration_id,
            first_name: data.first_name.trim(),
            last_name: (data.last_name || "").trim(),
            email: cleanEmail,
            phone: cleanPhone,
            usn: cleanUsn,
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
            .eq("email", cleanEmail)
            .maybeSingle();

        if (existingEmail) return { success: false, duplicateField: "email", error: "This email address is already registered." };

        const { data: existingPhone } = await supabase
            .from("attendees")
            .select("id")
            .eq("phone", cleanPhone)
            .maybeSingle();

        if (existingPhone) return { success: false, duplicateField: "phone", error: "This phone number is already registered." };

        if (cleanUsn) {
            const { data: existingUsn } = await supabase
                .from("attendees")
                .select("id")
                .eq("usn", cleanUsn)
                .maybeSingle();

            if (existingUsn) return { success: false, duplicateField: "usn", error: "This USN / ID is already registered." };
        }

        const insertPayload: Record<string, unknown> = {
            registration_id: data.registration_id,
            first_name: data.first_name.trim(),
            last_name: (data.last_name || "").trim(),
            email: cleanEmail,
            phone: cleanPhone,
            usn: cleanUsn || null,
            branch: data.branch || "Computer Science & Engg (CSE)",
            year: data.year || "3rd Year",
            qr_token: data.qr_token,
            checked_in: false,
            checked_in_at: null,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let { data: rawAttendee, error: insertError } = await (supabase.from("attendees") as any)
            .insert(insertPayload)
            .select()
            .single();

        // Fallback retry without branch/year if table hasn't executed migration 003
        if (insertError && (insertError.code === "42703" || insertError.message?.includes("branch"))) {
            const legacyPayload = { ...insertPayload };
            delete legacyPayload.branch;
            delete legacyPayload.year;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const retry = await (supabase.from("attendees") as any)
                .insert(legacyPayload)
                .select()
                .single();
            rawAttendee = retry.data;
            insertError = retry.error;
        }

        if (insertError || !rawAttendee) {
            console.error("Supabase insert error:", insertError?.code, insertError?.message);
            if (insertError?.code === "23505") {
                const detail = `${insertError.message} ${insertError.details || ""}`.toLowerCase();
                const field = detail.includes("email") ? "email"
                    : detail.includes("phone") ? "phone"
                        : detail.includes("usn") ? "usn"
                            : null;
                if (field) {
                    return { success: false, duplicateField: field, error: `This ${field === "usn" ? "USN / ID" : field} is already registered.` };
                }
            }
            // Fallback to mock mode if DB table fails or connection errors out
            throw new Error(insertError?.message || "Database insert failed");
        }

        return { success: true, attendee: rawAttendee as unknown as Attendee };
    } catch (err) {
        console.warn("Supabase fallback to local storage due to DB issue:", err);
        const newAttendee: Attendee = {
            id: `mock-${Date.now()}`,
            registration_id: data.registration_id,
            first_name: data.first_name.trim(),
            last_name: (data.last_name || "").trim(),
            email: cleanEmail,
            phone: cleanPhone,
            usn: cleanUsn,
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

export async function lookupAttendee(rawQuery: string): Promise<Attendee | null> {
    if (!rawQuery) return null;

    let search = rawQuery.trim();
    try {
        search = decodeURIComponent(search).trim();
        if (search.includes("/")) {
            const parts = search.split("/").filter(Boolean);
            search = parts[parts.length - 1] || search;
        }
    } catch { /* ignore */ }

    const cleanSearch = search.toLowerCase();

    const mockMatch = mockAttendees.find(
        (a) =>
            a.qr_token.toLowerCase() === cleanSearch ||
            a.registration_id.toLowerCase() === cleanSearch ||
            (a.usn && a.usn.toLowerCase() === cleanSearch) ||
            a.id.toLowerCase() === cleanSearch
    );
    if (mockMatch) return mockMatch;

    if (isMockMode()) return null;

    try {
        const supabase = await createAdminClient();

        // 1. Try registration_id (e.g. REG-12345678)
        const { data: byRegId } = await supabase
            .from("attendees")
            .select("*")
            .eq("registration_id", search)
            .maybeSingle();

        if (byRegId) return byRegId as unknown as Attendee;

        // 2. Try qr_token
        const { data: byToken } = await supabase
            .from("attendees")
            .select("*")
            .eq("qr_token", search)
            .maybeSingle();

        if (byToken) return byToken as unknown as Attendee;

        // 3. Try USN (case-insensitive)
        const { data: byUsn } = await supabase
            .from("attendees")
            .select("*")
            .ilike("usn", search)
            .maybeSingle();

        if (byUsn) return byUsn as unknown as Attendee;

        // 4. Try UUID id if valid format
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search);
        if (isUuid || search.startsWith("mock-")) {
            const { data: byId } = await supabase
                .from("attendees")
                .select("*")
                .eq("id", search)
                .maybeSingle();

            if (byId) return byId as unknown as Attendee;
        }

        return null;
    } catch (err) {
        console.error("lookupAttendee error:", err);
        return null;
    }
}

export async function deleteAttendee(idOrToken: string): Promise<{ success: boolean; error?: string }> {
    if (!idOrToken) return { success: false, error: "ID or Token required" };

    const clean = idOrToken.trim();

    // Delete from mock store if present
    const mockIdx = mockAttendees.findIndex(
        (a) => a.id === clean || a.qr_token === clean || a.registration_id === clean
    );
    if (mockIdx !== -1) {
        mockAttendees.splice(mockIdx, 1);
    }

    if (isMockMode()) return { success: true };

    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from("attendees")
            .delete()
            .or(`id.eq.${clean},qr_token.eq.${clean},registration_id.eq.${clean}`);

        if (error) {
            console.error("Delete attendee DB error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Delete failed" };
    }
}

export async function checkInAttendee(rawToken: string): Promise<{ success: boolean; message: string; attendee?: Attendee }> {
    if (!rawToken) return { success: false, message: "INVALID_TOKEN" };

    let token = rawToken.trim();
    try {
        if (token.includes("/")) {
            const parts = token.split("/").filter(Boolean);
            token = parts[parts.length - 1] || token;
        }
    } catch { /* ignore */ }

    const cleanToken = token.toLowerCase();

    // Check mock store if in mock mode or present in mock array
    const mockMatch = mockAttendees.find(
        (a) =>
            a.qr_token.toLowerCase() === cleanToken ||
            a.registration_id.toLowerCase() === cleanToken ||
            (a.usn && a.usn.toLowerCase() === cleanToken)
    );

    if (isMockMode() || (mockMatch && mockMatch.id.startsWith("mock-"))) {
        if (!mockMatch) return { success: false, message: "INVALID_TOKEN" };
        if (mockMatch.checked_in) return { success: false, message: "ALREADY_CHECKED_IN", attendee: mockMatch };

        mockMatch.checked_in = true;
        mockMatch.checked_in_at = new Date().toISOString();
        return { success: true, message: "SUCCESS", attendee: mockMatch };
    }

    try {
        const supabase = await createAdminClient();

        // Direct Query to find attendee
        const { data: rawAttendee } = await supabase
            .from("attendees")
            .select("*")
            .or(`qr_token.eq.${token},registration_id.eq.${token},usn.ilike.${token}`)
            .maybeSingle();

        const attendee = rawAttendee as unknown as Attendee | null;

        if (!attendee) {
            return { success: false, message: "INVALID_TOKEN" };
        }

        if (attendee.checked_in) {
            return { success: false, message: "ALREADY_CHECKED_IN", attendee };
        }

        const now = new Date().toISOString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: updated, error: updateError } = await (supabase.from("attendees") as any)
            .update({ checked_in: true, checked_in_at: now })
            .eq("id", attendee.id)
            .select()
            .single();

        if (updateError || !updated) {
            console.error("Direct check-in update error:", updateError);
            return { success: false, message: "UPDATE_FAILED" };
        }

        return {
            success: true,
            message: "SUCCESS",
            attendee: updated as unknown as Attendee,
        };
    } catch (err) {
        console.error("Check-in exception:", err);
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
