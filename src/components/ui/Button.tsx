"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = "primary",
            size = "md",
            loading,
            fullWidth,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const base =
            "inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0c0516] focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

        const variants = {
            primary:
                "bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold border border-amber-400 shadow-sm",
            secondary:
                "bg-[#1c0d38] hover:bg-[#28134f] text-white border border-[#3b1a6e] font-semibold",
            danger:
                "bg-red-700 hover:bg-red-600 text-white font-semibold border border-red-600",
            ghost: "hover:bg-[#1a0c33] text-slate-300 hover:text-white font-medium",
            outline:
                "border border-amber-500/60 text-amber-400 hover:bg-amber-500/10 font-semibold",
        };

        const sizes = {
            sm: "text-xs px-3 py-1.5 rounded-lg",
            md: "text-sm px-4 py-2.5 rounded-xl",
            lg: "text-sm px-6 py-3 rounded-xl font-bold uppercase tracking-wider",
        };

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={cn(
                    base,
                    variants[variant],
                    sizes[size],
                    fullWidth && "w-full",
                    className
                )}
                {...props}
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
export default Button;
