"use client";
import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    className?: string;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    className,
}: ModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-2xs animate-fade-in"
                onClick={onClose}
            />
            <div
                className={cn(
                    "relative w-full max-w-lg bg-[#140929] border border-[#2e1457] rounded-3xl p-6 shadow-2xl z-10 animate-slide-up text-white",
                    className
                )}
            >
                <div className="flex items-center justify-between pb-4 border-b border-[#29134e] mb-4">
                    {title && <h2 className="text-lg font-extrabold text-amber-400">{title}</h2>}
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-[#230f42] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
