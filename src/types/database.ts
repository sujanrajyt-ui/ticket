export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Attendee {
    id: string;
    registration_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    usn: string;
    branch?: string;
    year?: string;
    qr_token: string;
    checked_in: boolean;
    checked_in_at: string | null;
    created_at: string;
}

export interface Profile {
    id: string;
    role: "admin" | "volunteer";
}

export interface EventConfigRow {
    id: boolean;
    settings: { [key: string]: Json | undefined } | null;
    updated_at: string;
}

export interface TieBreakerCandidate {
    id: string; // attendee registration_id or id
    name: string;
    usn?: string;
    branch?: string;
}

export interface TieBreakerPoll {
    id: string;
    title: string;
    status: "active" | "closed";
    candidates: TieBreakerCandidate[];
    created_at: string;
    updated_at?: string;
}

export interface TieBreakerVote {
    id: string;
    poll_id: string;
    candidate_id: string;
    attendee_id: string;
    qr_token: string;
    created_at: string;
}

export interface Database {
    public: {
        Tables: {
            attendees: {
                Row: Attendee;
                Insert: {
                    id?: string;
                    registration_id: string;
                    first_name: string;
                    last_name: string;
                    email: string;
                    phone: string;
                    usn: string;
                    branch?: string;
                    year?: string;
                    qr_token: string;
                    checked_in?: boolean;
                    checked_in_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    registration_id?: string;
                    first_name?: string;
                    last_name?: string;
                    email?: string;
                    phone?: string;
                    usn?: string;
                    branch?: string;
                    year?: string;
                    qr_token?: string;
                    checked_in?: boolean;
                    checked_in_at?: string | null;
                    created_at?: string;
                };
                Relationships: [];
            };
            profiles: {
                Row: Profile;
                Insert: Profile;
                Update: Partial<Profile>;
                Relationships: [];
            };
            event_config: {
                Row: EventConfigRow;
                Insert: {
                    id?: boolean;
                    settings?: { [key: string]: Json | undefined } | null;
                    updated_at?: string;
                };
                Update: {
                    id?: boolean;
                    settings?: { [key: string]: Json | undefined } | null;
                    updated_at?: string;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            check_in_attendee: {
                Args: { p_token: string };
                Returns: {
                    success: boolean;
                    message: string;
                    attendee_data: Json;
                }[];
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}

export interface CheckInResult {
    success: boolean;
    message: "SUCCESS" | "ALREADY_CHECKED_IN" | "INVALID_QR";
    attendee_data: {
        name?: string;
        usn?: string;
        registration_id?: string;
        checked_in_at?: string;
    } | null;
}

export interface RegistrationInput {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    usn: string;
    branch?: string;
    year?: string;
}

export interface AttendeeStats {
    total: number;
    checked_in: number;
    remaining: number;
    rate: number;
}
