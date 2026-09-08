"use client";
import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, hint, id: customId, type = "text", ...props }, ref) => {
        const generatedId = useId();
        const inputId = customId || generatedId;

        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-xs font-bold text-slate-200 uppercase tracking-wider"
                    >
                        {label}
                        {props.required && <span className="text-amber-400 ml-1">*</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    type={type}
                    className={cn(
                        "w-full bg-[#120721] border border-[#2b144e] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 hover:border-[#3c1d6b]",
                        error && "border-red-500/80 focus:ring-red-500 focus:border-red-500",
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
                {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";
export default Input;
