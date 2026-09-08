import { cn } from "@/lib/utils";

interface BadgeProps {
    variant?: "success" | "warning" | "error" | "neutral" | "info";
    children: React.ReactNode;
    className?: string;
    dot?: boolean;
}

export default function Badge({ variant = "neutral", children, className, dot }: BadgeProps) {
    const variants = {
        success: "bg-emerald-950 text-emerald-400 border border-emerald-800",
        warning: "bg-amber-950 text-amber-400 border border-amber-800",
        error: "bg-red-950 text-red-400 border border-red-800",
        neutral: "bg-gray-800 text-gray-300 border border-gray-700",
        info: "bg-violet-950 text-violet-400 border border-violet-800",
    };

    const dots = {
        success: "bg-emerald-400",
        warning: "bg-amber-400",
        error: "bg-red-400",
        neutral: "bg-gray-400",
        info: "bg-violet-400",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide",
                variants[variant],
                className
            )}
        >
            {dot && (
                <span className={cn("w-1.5 h-1.5 rounded-full", dots[variant])} />
            )}
            {children}
        </span>
    );
}
