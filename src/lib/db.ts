import { Attendee, TieBreakerPoll, TieBreakerVote } from "@/types/database";
import { createAdminClient } from "./supabase/server";

// Global in-memory storage for local demo / preview mode when Supabase is unconfigured
const globalMockStore = globalThis as unknown as {
    mockAttendees?: Attendee[];
    mockPoll?: TieBreakerPoll | null;
    mockVotes?: TieBreakerVote[];
};

if (!globalMockStore.mockAttendees) {
    globalMockStore.mockAttendees = [];
}
if (globalMockStore.mockPoll === undefined) {
    globalMockStore.mockPoll = null;
}
if (!globalMockStore.mockVotes) {
    globalMockStore.mockVotes = [];
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

    const phoneDigits = search.replace(/\D/g, "");
    const mockMatch = mockAttendees.find(
        (a) =>
            a.qr_token.toLowerCase() === cleanSearch ||
            a.registration_id.toLowerCase() === cleanSearch ||
            (a.usn && a.usn.toLowerCase() === cleanSearch) ||
            a.id.toLowerCase() === cleanSearch ||
            (a.email && a.email.toLowerCase() === cleanSearch) ||
            (phoneDigits.length >= 10 && a.phone === phoneDigits)
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

        // 4. Try Phone (if contains 10 digits)
        if (phoneDigits.length === 10) {
            const { data: byPhone } = await supabase
                .from("attendees")
                .select("*")
                .eq("phone", phoneDigits)
                .maybeSingle();

            if (byPhone) return byPhone as unknown as Attendee;
        }

        // 5. Try Email
        if (search.includes("@")) {
            const { data: byEmail } = await supabase
                .from("attendees")
                .select("*")
                .ilike("email", search)
                .maybeSingle();

            if (byEmail) return byEmail as unknown as Attendee;
        }

        // 6. Try UUID id if valid format
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

export async function lookupAttendeeByPhone(phone: string): Promise<Attendee | null> {
    const clean = phone.trim().replace(/\D/g, "");
    if (!clean) return null;

    // Check mock store first
    const mockMatch = mockAttendees.find((a) => a.phone === clean);
    if (mockMatch) return mockMatch;

    if (isMockMode()) return null;

    try {
        const supabase = await createAdminClient();
        const { data } = await supabase
            .from("attendees")
            .select("*")
            .eq("phone", clean)
            .maybeSingle();
        return data as unknown as Attendee | null;
    } catch {
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

        // Try by registration_id first (most common path from admin UI)
        let { data, error } = await supabase
            .from("attendees")
            .delete()
            .eq("registration_id", clean)
            .select("id");

        // If no match, try by qr_token
        if (!error && (!data || data.length === 0)) {
            const res2 = await supabase
                .from("attendees")
                .delete()
                .eq("qr_token", clean)
                .select("id");
            data = res2.data;
            error = res2.error;
        }

        // If still no match and clean looks like a UUID, try by id
        if (!error && (!data || data.length === 0)) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
            if (isUuid || clean.startsWith("mock-")) {
                const res3 = await supabase
                    .from("attendees")
                    .delete()
                    .eq("id", clean)
                    .select("id");
                data = res3.data;
                error = res3.error;
            }
        }

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

        // Try by qr_token first
        let { data: rawAttendee } = await supabase
            .from("attendees")
            .select("*")
            .eq("qr_token", token)
            .maybeSingle();

        // If no match, try by registration_id
        if (!rawAttendee) {
            const { data } = await supabase
                .from("attendees")
                .select("*")
                .eq("registration_id", token)
                .maybeSingle();
            rawAttendee = data;
        }

        // If no match, try by USN (case-insensitive)
        if (!rawAttendee) {
            const { data } = await supabase
                .from("attendees")
                .select("*")
                .ilike("usn", token)
                .maybeSingle();
            rawAttendee = data;
        }

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
                (a.usn?.toLowerCase() || "").includes(s) ||
                a.registration_id.toLowerCase().includes(s)
        );
    }

    return { attendees: filtered, total: filtered.length };
}

// ============================================================
// TIE BREAKER POLL FUNCTIONS
// ============================================================

export async function getTieBreakerPoll(): Promise<{
    poll: TieBreakerPoll | null;
    voteCounts: Record<string, number>;
    totalVotes: number;
}> {
    if (isMockMode()) {
        const poll = globalMockStore.mockPoll || null;
        const votes = globalMockStore.mockVotes || [];
        const voteCounts: Record<string, number> = {};
        if (poll) {
            poll.candidates.forEach((c) => (voteCounts[c.id] = 0));
            votes.filter((v) => v.poll_id === poll.id).forEach((v) => {
                voteCounts[v.candidate_id] = (voteCounts[v.candidate_id] || 0) + 1;
            });
        }
        const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);
        return { poll, voteCounts, totalVotes };
    }

    try {
        const supabase = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: pollData } = await (supabase.from("tie_breaker_polls") as any)
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!pollData) {
            // Fallback to mock poll if DB table not created yet
            const mockP = globalMockStore.mockPoll || null;
            const mockV = globalMockStore.mockVotes || [];
            const counts: Record<string, number> = {};
            if (mockP) {
                mockP.candidates.forEach((c) => (counts[c.id] = 0));
                mockV.filter((v) => v.poll_id === mockP.id).forEach((v) => {
                    counts[v.candidate_id] = (counts[v.candidate_id] || 0) + 1;
                });
            }
            return { poll: mockP, voteCounts: counts, totalVotes: Object.values(counts).reduce((a, b) => a + b, 0) };
        }

        const poll: TieBreakerPoll = pollData as unknown as TieBreakerPoll;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: votesData } = await (supabase.from("tie_breaker_votes") as any)
            .select("candidate_id")
            .eq("poll_id", poll.id);

        const voteCounts: Record<string, number> = {};
        poll.candidates.forEach((c) => (voteCounts[c.id] = 0));
        (votesData || []).forEach((v: { candidate_id: string }) => {
            voteCounts[v.candidate_id] = (voteCounts[v.candidate_id] || 0) + 1;
        });

        const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);
        return { poll, voteCounts, totalVotes };
    } catch {
        const mockP = globalMockStore.mockPoll || null;
        const mockV = globalMockStore.mockVotes || [];
        const counts: Record<string, number> = {};
        if (mockP) {
            mockP.candidates.forEach((c) => (counts[c.id] = 0));
            mockV.filter((v) => v.poll_id === mockP.id).forEach((v) => {
                counts[v.candidate_id] = (counts[v.candidate_id] || 0) + 1;
            });
        }
        return { poll: mockP, voteCounts: counts, totalVotes: Object.values(counts).reduce((a, b) => a + b, 0) };
    }
}

export async function createOrUpdateTieBreakerPoll(
    title: string,
    candidateItems: (string | { id?: string; name: string; usn?: string; branch?: string })[]
): Promise<{ success: boolean; poll?: TieBreakerPoll; error?: string }> {
    if (!candidateItems || candidateItems.length < 2) {
        return { success: false, error: "Provide at least 2 candidates for the tie breaker." };
    }

    const { attendees } = await getAttendees("", "checked_in");

    const validCandidates = candidateItems
        .map((item, idx) => {
            if (typeof item === "object" && item.name) {
                return {
                    id: item.id || `cand-${idx + 1}-${Date.now()}`,
                    name: item.name.trim(),
                    usn: item.usn || "",
                    branch: item.branch || "N/A",
                };
            }

            const str = String(item).trim();
            // Try lookup among checked-in attendees first
            const found = attendees.find(
                (a) => a.id === str || a.registration_id === str || a.qr_token === str || a.usn === str
            );

            if (found) {
                return {
                    id: found.registration_id || found.id,
                    name: `${found.first_name} ${found.last_name}`.trim(),
                    usn: found.usn || "",
                    branch: found.branch || "N/A",
                };
            }

            // Treat as manual candidate name!
            return {
                id: `cand-${idx + 1}-${Date.now()}`,
                name: str,
                usn: "",
                branch: "Tie Breaker Candidate",
            };
        })
        .filter((c) => c.name.length > 0);

    if (validCandidates.length < 2) {
        return {
            success: false,
            error: "Please enter or select at least 2 valid candidates for the tie breaker poll.",
        };
    }

    const pollObj: TieBreakerPoll = {
        id: `poll-${Date.now()}`,
        title: title || "Tie Breaker Voting Poll",
        status: "active",
        candidates: validCandidates,
        created_at: new Date().toISOString(),
    };

    // Update mock store
    globalMockStore.mockPoll = pollObj;
    globalMockStore.mockVotes = [];

    if (isMockMode()) {
        return { success: true, poll: pollObj };
    }

    try {
        const supabase = await createAdminClient();
        // Close any existing active polls first
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("tie_breaker_polls") as any)
            .update({ status: "closed" })
            .eq("status", "active");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newPoll, error } = await (supabase.from("tie_breaker_polls") as any)
            .insert({
                title: pollObj.title,
                status: "active",
                candidates: validCandidates,
            })
            .select()
            .single();

        if (error || !newPoll) {
            console.warn("DB insert error for tie_breaker_polls, using in-memory fallback:", error?.message);
            return { success: true, poll: pollObj };
        }

        return { success: true, poll: newPoll as unknown as TieBreakerPoll };
    } catch {
        return { success: true, poll: pollObj };
    }
}

export async function closeTieBreakerPoll(): Promise<{ success: boolean }> {
    if (globalMockStore.mockPoll) {
        globalMockStore.mockPoll.status = "closed";
    }

    if (isMockMode()) return { success: true };

    try {
        const supabase = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("tie_breaker_polls") as any)
            .update({ status: "closed" })
            .eq("status", "active");
        return { success: true };
    } catch {
        return { success: true };
    }
}

export async function getTieBreakerVoteStatus(rawTokenOrId: string): Promise<{
    eligible: boolean;
    reason?: string;
    checkedIn: boolean;
    hasVoted: boolean;
    votedCandidateId?: string;
    poll?: TieBreakerPoll | null;
    voteCounts?: Record<string, number>;
    totalVotes?: number;
}> {
    const attendee = await lookupAttendee(rawTokenOrId);
    if (!attendee) {
        return { eligible: false, checkedIn: false, hasVoted: false, reason: "Attendee not found" };
    }

    if (!attendee.checked_in) {
        return { eligible: false, checkedIn: false, hasVoted: false, reason: "Not checked in" };
    }

    const { poll, voteCounts, totalVotes } = await getTieBreakerPoll();
    if (!poll || poll.status !== "active") {
        return { eligible: true, checkedIn: true, hasVoted: false, poll: null };
    }

    let hasVoted = false;
    let votedCandidateId: string | undefined = undefined;

    // Check mock votes
    const mockV = (globalMockStore.mockVotes || []).find(
        (v) => v.poll_id === poll.id && (v.attendee_id === attendee.id || v.qr_token === attendee.qr_token || v.attendee_id === attendee.registration_id)
    );
    if (mockV) {
        hasVoted = true;
        votedCandidateId = mockV.candidate_id;
    }

    if (!hasVoted && !isMockMode()) {
        try {
            const supabase = await createAdminClient();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase.from("tie_breaker_votes") as any)
                .select("candidate_id")
                .eq("poll_id", poll.id)
                .or(`attendee_id.eq.${attendee.id},attendee_id.eq.${attendee.registration_id},qr_token.eq.${attendee.qr_token}`)
                .maybeSingle();

            if (data) {
                hasVoted = true;
                votedCandidateId = data.candidate_id;
            }
        } catch { /* ignored */ }
    }

    return {
        eligible: true,
        checkedIn: true,
        hasVoted,
        votedCandidateId,
        poll,
        voteCounts,
        totalVotes,
    };
}

export async function castTieBreakerVote(
    rawTokenOrId: string,
    candidateId: string
): Promise<{ success: boolean; error?: string }> {
    const attendee = await lookupAttendee(rawTokenOrId);
    if (!attendee) {
        return { success: false, error: "Invalid attendee ticket." };
    }

    if (!attendee.checked_in) {
        return { success: false, error: "Voting is strictly reserved for attendees who have checked in at the venue." };
    }

    const { poll } = await getTieBreakerPoll();
    if (!poll || poll.status !== "active") {
        return { success: false, error: "No active tie breaker poll available." };
    }

    const isCandidateValid = poll.candidates.some((c) => c.id === candidateId);
    if (!isCandidateValid) {
        return { success: false, error: "Invalid candidate selection." };
    }

    const voteStatus = await getTieBreakerVoteStatus(rawTokenOrId);
    if (voteStatus.hasVoted) {
        return { success: false, error: "You have already cast your vote in this tie breaker." };
    }

    const voteObj: TieBreakerVote = {
        id: `vote-${Date.now()}`,
        poll_id: poll.id,
        candidate_id: candidateId,
        attendee_id: attendee.id || attendee.registration_id,
        qr_token: attendee.qr_token,
        created_at: new Date().toISOString(),
    };

    if (!globalMockStore.mockVotes) globalMockStore.mockVotes = [];
    globalMockStore.mockVotes.push(voteObj);

    if (isMockMode()) {
        return { success: true };
    }

    try {
        const supabase = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("tie_breaker_votes") as any).insert({
            poll_id: poll.id,
            candidate_id: candidateId,
            attendee_id: attendee.id || attendee.registration_id,
            qr_token: attendee.qr_token,
        });

        if (error) {
            if (error.code === "23505") {
                return { success: false, error: "You have already cast your vote." };
            }
            console.warn("DB insert error for tie_breaker_votes, mock saved:", error.message);
        }
        return { success: true };
    } catch {
        return { success: true };
    }
}

