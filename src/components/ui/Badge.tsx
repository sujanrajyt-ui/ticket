import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: "success" | "warning" | "error" | "neutral" | "info" | "gold";
    dot?: boolean;
    children: ReactNode;
}

export default function Badge({
    variant = "neutral",
    dot = false,
    children,
    className,
    ...props
}: BadgeProps) {
    const variants = {
        success: "bg-emerald-950/80 text-emerald-300 border-emerald-800/80",
        warning: "bg-amber-950/80 text-amber-300 border-amber-800/80",
        error: "bg-red-950/80 text-red-300 border-red-800/80",
        neutral: "bg-[#1e0e38] text-slate-300 border-[#381a69]",
        info: "bg-purple-950/80 text-purple-300 border-purple-800/80",
        gold: "bg-amber-500/10 text-amber-400 border-amber-500/40 font-bold",
    };

    const dotColors = {
        success: "bg-emerald-400",
        warning: "bg-amber-400",
        error: "bg-red-400",
        neutral: "bg-slate-400",
        info: "bg-purple-400",
        gold: "bg-amber-400",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs",
                variants[variant],
                className
            )}
            {...props}
        >
            {dot && (
                <span
                    className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dotColors[variant])}
                />
            )}
            {children}
        </span>
    );
}
