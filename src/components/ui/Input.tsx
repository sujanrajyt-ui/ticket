"use client";
import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    helperText?: string;
    prefix?: string;
    required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, prefix, required, className, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-200">
                    {label}
                    {required && <span className="text-violet-400 ml-1">*</span>}
                </label>
                <div className="relative flex items-center">
                    {prefix && (
                        <div className="absolute left-3.5 flex items-center pointer-events-none">
                            <span className="text-sm text-gray-400 font-medium">{prefix}</span>
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            "w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 text-white text-sm",
                            "placeholder:text-gray-500 transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500",
                            "hover:border-white/20",
                            error && "border-red-500 focus:ring-red-500",
                            prefix && "pl-14",
                            className
                        )}
                        {...props}
                    />
                </div>
                {helperText && !error && (
                    <p className="text-xs text-gray-500">{helperText}</p>
                )}
                {error && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
export default Input;
