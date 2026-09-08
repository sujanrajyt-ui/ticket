"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EVENT_CONFIG } from "@/config/event";
import Button from "@/components/ui/Button";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
            setError("Invalid email or password.");
            setLoading(false);
            return;
        }
        router.push("/admin");
        router.refresh();
    };

    return (
        <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm animate-fade-in">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 mx-auto mb-4 bg-violet-950 border border-violet-800 rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-7 h-7 text-violet-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{EVENT_CONFIG.name}</h1>
                    <p className="text-gray-500 text-sm mt-1">Admin / Volunteer Portal</p>
                </div>

                <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-lg font-semibold text-white mb-5">Sign In</h2>

                    {error && (
                        <div className="mb-4 bg-red-950/50 border border-red-800 rounded-xl px-4 py-3">
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-300">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                required
                                className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-300">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                            />
                        </div>
                        <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
                            <LogIn className="w-4 h-4" />
                            Sign In
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
}
