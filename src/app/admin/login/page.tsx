"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserCheck } from "lucide-react";
import { useEventConfig } from "@/components/EventConfigProvider";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminLoginPage() {
    const router = useRouter();
    const { settings } = useEventConfig();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                setError(json.error || "Invalid username or password.");
                setLoading(false);
                return;
            }

            router.push(json.redirect || "/admin");
        } catch {
            setError("Network error. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0c0516] text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#150a29] border-2 border-[#3b1a6e] rounded-3xl p-8 shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-14 h-14 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400">
                        <ShieldCheck className="w-7 h-7" />
                    </div>
                    <h1 className="text-xl font-black text-white">Organizer Portal</h1>
                    <p className="text-xs text-slate-400">{settings.name} Check-in Management</p>
                </div>

                <div className="bg-[#120721] border border-[#2b144e] rounded-2xl p-4 text-xs text-slate-300 space-y-1.5 font-medium">
                    <p className="font-bold text-amber-400 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-amber-400" /> Authorized Roles:
                    </p>
                    <p><span className="text-white font-bold">Admin:</span> username <code className="text-amber-300 font-mono bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">admin</code></p>
                    <p><span className="text-white font-bold">Volunteer:</span> username <code className="text-amber-300 font-mono bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">volunteer</code></p>
                </div>

                {error && (
                    <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                        label="Username or Email"
                        type="text"
                        placeholder="admin or volunteer"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username"
                        autoCapitalize="none"
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />

                    <Button type="submit" fullWidth size="lg" loading={loading} className="py-3.5 mt-2">
                        Sign In to Console
                    </Button>
                </form>
            </div>
        </div>
    );
}

