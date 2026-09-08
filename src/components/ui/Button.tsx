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
            "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

        const variants = {
            primary:
                "bg-violet-600 hover:bg-violet-500 text-white focus:ring-violet-500 shadow-lg shadow-violet-900/40",
            secondary:
                "bg-white/10 hover:bg-white/15 text-white border border-white/20 focus:ring-white/40",
            danger:
                "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500 shadow-lg shadow-red-900/40",
            ghost: "hover:bg-white/10 text-gray-300 hover:text-white focus:ring-white/20",
            outline:
                "border border-violet-500 text-violet-400 hover:bg-violet-950 focus:ring-violet-500",
        };

        const sizes = {
            sm: "text-sm px-3 py-1.5",
            md: "text-sm px-5 py-2.5",
            lg: "text-base px-6 py-3",
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
