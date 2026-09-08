"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EVENT_CONFIG } from "@/config/event";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message || "Invalid credentials.");
            setLoading(false);
            return;
        }

        router.push("/admin");
    };

    return (
        <div className="min-h-screen bg-[#0c0516] text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#150a29] border-2 border-[#3b1a6e] rounded-3xl p-8 shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h1 className="text-xl font-extrabold text-white">Organizer Portal</h1>
                    <p className="text-xs text-slate-400">{EVENT_CONFIG.name} Check-in Management</p>
                </div>

                {error && (
                    <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                        label="Admin / Volunteer Email"
                        type="email"
                        placeholder="admin@nitte.edu.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <Button type="submit" fullWidth size="lg" loading={loading} className="py-3.5 mt-2">
                        Sign In to Console
                    </Button>
                </form>
            </div>
        </div>
    );
}
