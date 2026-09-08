import { ReactNode } from "react";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    subtitle?: string;
    color?: "violet" | "emerald" | "amber" | "blue";
}

export default function StatsCard({
    title,
    value,
    icon,
    subtitle,
    color = "violet",
}: StatsCardProps) {
    const borderColors = {
        violet: "border-[#3b1a6e]",
        emerald: "border-emerald-800/60",
        amber: "border-amber-700/60",
        blue: "border-blue-800/60",
    };

    const iconBg = {
        violet: "bg-[#250d48] text-amber-400 border border-amber-500/30",
        emerald: "bg-emerald-950/80 text-emerald-400 border border-emerald-800",
        amber: "bg-amber-950/80 text-amber-400 border border-amber-800",
        blue: "bg-blue-950/80 text-blue-400 border border-blue-800",
    };

    return (
        <div className={`bg-[#140929] border ${borderColors[color]} rounded-3xl p-5 shadow-sm space-y-3`}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{title}</span>
                <div className={`p-2.5 rounded-2xl ${iconBg[color]}`}>{icon}</div>
            </div>
            <div>
                <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
                {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
            </div>
        </div>
    );
}
