import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color?: "violet" | "emerald" | "amber" | "blue";
}

export default function StatsCard({ title, value, subtitle, icon, color = "violet" }: StatsCardProps) {
    const colors = {
        violet: { bg: "bg-violet-950/50", icon: "bg-violet-900/60 text-violet-400", border: "border-violet-800/30" },
        emerald: { bg: "bg-emerald-950/50", icon: "bg-emerald-900/60 text-emerald-400", border: "border-emerald-800/30" },
        amber: { bg: "bg-amber-950/50", icon: "bg-amber-900/60 text-amber-400", border: "border-amber-800/30" },
        blue: { bg: "bg-blue-950/50", icon: "bg-blue-900/60 text-blue-400", border: "border-blue-800/30" },
    };

    const c = colors[color];

    return (
        <div className={cn("rounded-2xl border p-5 flex items-center gap-4", c.bg, c.border)}>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", c.icon)}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest truncate">{title}</p>
                <p className="text-3xl font-bold text-white mt-0.5">{value}</p>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}
