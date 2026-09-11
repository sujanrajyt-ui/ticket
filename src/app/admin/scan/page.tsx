"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Camera, CameraOff, CheckCircle2, AlertTriangle, XCircle, RotateCcw, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { format } from "date-fns";

type ScanState = "scanning" | "loading" | "valid" | "already_checked_in" | "invalid" | "checked_in_success";

interface ScanResult {
    name?: string;
    usn?: string;
    registration_id?: string;
    checked_in?: boolean;
    checked_in_at?: string;
}

export default function ScannerPage() {
    const router = useRouter();
    const scannerRef = useRef<HTMLDivElement>(null);
    const scannerInstanceRef = useRef<InstanceType<typeof import("html5-qrcode")["Html5Qrcode"]> | null>(null);
    const [state, setState] = useState<ScanState>("scanning");
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [currentToken, setCurrentToken] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkInTime, setCheckInTime] = useState<string | null>(null);
    const [autoCheckInMode, setAutoCheckInMode] = useState(false);
    const autoCheckInModeRef = useRef(false);
    const isProcessing = useRef(false);

    const stopCamera = useCallback(async () => {
        if (scannerInstanceRef.current) {
            try {
                await scannerInstanceRef.current.stop();
                scannerInstanceRef.current.clear();
            } catch { /* ignore */ }
            scannerInstanceRef.current = null;
        }
    }, []);

    const extractToken = (text: string): string => {
        try {
            const url = new URL(text);
            const parts = url.pathname.split("/");
            return parts[parts.length - 1] || text;
        } catch {
            return text.trim();
        }
    };

    const performCheckIn = async (token: string, currentResult?: ScanResult) => {
        setCheckingIn(true);
        try {
            const res = await fetch("/api/checkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            const json = await res.json();

            if (json.success || json.message === "SUCCESS") {
                setCheckInTime(format(new Date(), "h:mm a"));
                if (json.attendee) {
                    setScanResult({
                        name: `${json.attendee.first_name} ${json.attendee.last_name}`.trim(),
                        usn: json.attendee.usn,
                        registration_id: json.attendee.registration_id,
                        checked_in: true,
                        checked_in_at: json.attendee.checked_in_at,
                    });
                }
                setState("checked_in_success");
            } else if (json.message === "ALREADY_CHECKED_IN") {
                setState("already_checked_in");
                setScanResult({
                    name: json.attendee?.first_name ? `${json.attendee.first_name} ${json.attendee.last_name}`.trim() : currentResult?.name,
                    usn: json.attendee?.usn || currentResult?.usn,
                    registration_id: json.attendee?.registration_id || currentResult?.registration_id,
                    checked_in: true,
                    checked_in_at: json.attendee?.checked_in_at || currentResult?.checked_in_at,
                });
            } else {
                setState("invalid");
            }
        } catch {
            setCameraError("Network error during check-in.");
            setState("scanning");
        } finally {
            setCheckingIn(false);
            isProcessing.current = false;
        }
    };

    const handleScan = useCallback(async (decodedText: string) => {
        if (isProcessing.current || state !== "scanning") return;
        isProcessing.current = true;

        const token = extractToken(decodedText);
        setCurrentToken(token);
        setState("loading");

        // Immediately pause camera to stop double-scans
        await stopCamera();

        try {
            if (autoCheckInModeRef.current) {
                await performCheckIn(token);
                return;
            }

            const res = await fetch(`/api/lookup?token=${encodeURIComponent(token)}`);
            const json = await res.json();

            if (!res.ok || !json.found) {
                setState("invalid");
                isProcessing.current = false;
                return;
            }

            const result: ScanResult = {
                name: json.name,
                usn: json.usn,
                registration_id: json.registration_id,
                checked_in: json.checked_in,
                checked_in_at: json.checked_in_at,
            };

            setScanResult(result);

            if (json.checked_in) {
                setState("already_checked_in");
            } else {
                setState("valid");
            }
        } catch {
            setCameraError("Network error. Please check your connection.");
            setState("scanning");
        } finally {
            isProcessing.current = false;
        }
    }, [state, stopCamera]);

    const startCamera = useCallback(async () => {
        if (!scannerRef.current) return;
        try {
            const { Html5Qrcode } = await import("html5-qrcode");
            const scanner = new Html5Qrcode("qr-scanner-container");
            scannerInstanceRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
                handleScan,
                () => { }
            );
            setCameraError(null);
        } catch (err) {
            if (err instanceof Error) {
                if (err.message.includes("permission") || err.message.includes("NotAllowed")) {
                    setCameraError("Camera permission denied. Please allow camera access in browser settings.");
                } else if (err.message.includes("NotFound") || err.message.includes("no camera")) {
                    setCameraError("No camera found on this device.");
                } else {
                    setCameraError("Could not start camera. Please try reloading.");
                }
            }
        }
    }, [handleScan]);

    const resetScanner = useCallback(async () => {
        await stopCamera();
        setState("scanning");
        setScanResult(null);
        setCurrentToken(null);
        setCheckInTime(null);
        isProcessing.current = false;
        await startCamera();
    }, [startCamera, stopCamera]);

    useEffect(() => {
        if (state === "scanning" && !cameraError) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            startCamera();
        }
        return () => { stopCamera(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);

    // Auto-resume scanner 2.5 seconds after successful check-in
    useEffect(() => {
        if (state === "checked_in_success") {
            const timer = setTimeout(() => {
                resetScanner();
            }, 2200);
            return () => clearTimeout(timer);
        }
    }, [state, resetScanner]);

    const handleConfirmCheckIn = async () => {
        if (!currentToken) return;
        await performCheckIn(currentToken, scanResult || undefined);
    };

    return (
        <div className="min-h-screen bg-[#0c0516] text-white flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-[#120721] border-b border-[#241047] shadow-md sticky-safe">
                <button
                    onClick={() => { stopCamera(); router.push("/admin"); }}
                    className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Dashboard
                </button>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <h1 className="text-xs font-black text-amber-400 uppercase tracking-wider">QR Check-In Kiosk</h1>
                </div>
                {/* Mode toggle */}
                <button
                    onClick={() => {
                        const next = !autoCheckInMode;
                        setAutoCheckInMode(next);
                        autoCheckInModeRef.current = next;
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 bg-[#1e0c38] px-3 py-1.5 rounded-full border border-[#3b1a6e] hover:border-amber-500/50 transition-all"
                    title="Toggle auto check-in on scan"
                >
                    {autoCheckInMode ? (
                        <>
                            <ToggleRight className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Auto</span>
                        </>
                    ) : (
                        <>
                            <ToggleLeft className="w-4 h-4 text-amber-400" />
                            <span className="text-amber-400 font-bold">Manual</span>
                        </>
                    )}
                </button>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-4">
                {/* SCANNING / LOADING STATE */}
                {(state === "scanning" || state === "loading") && (
                    <div className="w-full max-w-sm">
                        {cameraError ? (
                            <div className="text-center space-y-4 bg-[#150a29] border border-red-900/60 p-6 rounded-3xl shadow-xl">
                                <div className="w-14 h-14 mx-auto bg-red-950 border border-red-800 rounded-2xl flex items-center justify-center">
                                    <CameraOff className="w-7 h-7 text-red-400" />
                                </div>
                                <p className="text-red-400 font-bold text-base">Camera Unavailable</p>
                                <p className="text-slate-400 text-xs">{cameraError}</p>
                                <Button onClick={() => { setCameraError(null); startCamera(); }} variant="secondary">
                                    Try Again
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-4">
                                    <p className="text-slate-200 text-xs font-bold flex items-center justify-center gap-2">
                                        <Camera className="w-4 h-4 text-amber-400 animate-pulse" />
                                        {state === "loading" ? "Validating Ticket QR…" : "Position attendee's QR pass inside frame"}
                                    </p>
                                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                                        Mode: <span className="text-amber-400 font-bold">{autoCheckInMode ? "Direct Auto Check-In" : "Manual Confirmation Required"}</span>
                                    </p>
                                </div>

                                {/* Scanner view container */}
                                <div
                                    id="qr-scanner-container"
                                    ref={scannerRef}
                                    className="w-full aspect-square rounded-3xl overflow-hidden bg-[#120721] border-2 border-[#3b1a6e] shadow-2xl relative"
                                >
                                    {state === "loading" && (
                                        <div className="absolute inset-0 bg-black/70 backdrop-blur-2xs flex flex-col items-center justify-center gap-3 z-10">
                                            <div className="w-9 h-9 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                            <p className="text-xs text-amber-300 font-bold">Verifying Ticket Pass…</p>
                                        </div>
                                    )}
                                </div>
                                <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">
                                    Align the QR code clearly to trigger scan
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* VALID (Prompt to Check In) */}
                {state === "valid" && scanResult && (
                    <div className="w-full max-w-sm space-y-4">
                        <div className="rounded-3xl bg-[#150a29] border-2 border-emerald-500/80 p-6 text-center shadow-2xl space-y-3">
                            <div className="w-14 h-14 mx-auto bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-xs text-emerald-400 font-extrabold tracking-widest uppercase">VALID TICKET PASS FOUND</p>
                                <p className="text-white font-black text-2xl mt-1">{scanResult.name}</p>
                            </div>
                            <div className="bg-[#120721] border border-[#2b144e] rounded-xl p-3 text-xs space-y-1 font-mono text-slate-300">
                                <p><span className="text-slate-400">USN / ID:</span> <span className="text-amber-400 font-bold">{scanResult.usn || "N/A"}</span></p>
                                <p><span className="text-slate-400">REG ID:</span> #{scanResult.registration_id}</p>
                            </div>
                            <p className="text-xs text-slate-300 font-medium">Click below to record official entry at kiosk.</p>
                        </div>
                        <div className="space-y-3">
                            <Button onClick={handleConfirmCheckIn} fullWidth size="lg" loading={checkingIn}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base py-3.5 shadow-xl border-emerald-500">
                                <CheckCircle2 className="w-5 h-5" />
                                CHECK IN ATTENDEE NOW
                            </Button>
                            <Button onClick={resetScanner} variant="secondary" fullWidth size="lg">
                                <RotateCcw className="w-4 h-4" /> Cancel / Scan Another
                            </Button>
                        </div>
                    </div>
                )}

                {/* CHECKED IN SUCCESS */}
                {state === "checked_in_success" && scanResult && (
                    <div className="w-full max-w-sm space-y-4">
                        <div className="rounded-3xl bg-emerald-950/90 border-2 border-emerald-500 p-6 text-center shadow-2xl space-y-3">
                            <div className="w-16 h-16 mx-auto bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            </div>
                            <p className="text-emerald-300 font-black text-xl tracking-wide uppercase">CHECK-IN SUCCESSFUL!</p>
                            <p className="text-white font-black text-2xl">{scanResult.name}</p>
                            <p className="text-amber-400 font-mono text-xs font-bold">USN: {scanResult.usn || "N/A"} · #{scanResult.registration_id}</p>
                            <div className="bg-emerald-900/40 border border-emerald-600/40 rounded-xl px-4 py-2 text-xs text-emerald-200 font-semibold">
                                ✓ Entry timestamp: {checkInTime || "Just now"}
                            </div>
                        </div>
                        <Button onClick={resetScanner} fullWidth size="lg" variant="primary">
                            <Camera className="w-4 h-4" /> Scan Next Attendee
                        </Button>
                    </div>
                )}

                {/* ALREADY CHECKED IN (FAILED / DUPLICATE WARNING) */}
                {state === "already_checked_in" && scanResult && (
                    <div className="w-full max-w-sm space-y-4">
                        <div className="rounded-3xl bg-amber-950/90 border-2 border-amber-600 p-6 text-center shadow-2xl space-y-3">
                            <div className="w-16 h-16 mx-auto bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-10 h-10 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-amber-300 font-black text-lg tracking-wider uppercase">ALREADY CHECKED IN</p>
                                <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mt-0.5">DUPLICATE PASS DETECTED</p>
                            </div>
                            <p className="text-white font-black text-xl">{scanResult.name}</p>
                            <div className="bg-amber-900/40 border border-amber-600/40 rounded-xl p-3 text-xs text-amber-200 space-y-1 font-mono">
                                <p><span className="text-amber-300/80">USN:</span> {scanResult.usn || "N/A"}</p>
                                <p><span className="text-amber-300/80">Reg ID:</span> #{scanResult.registration_id}</p>
                                {scanResult.checked_in_at && (
                                    <p className="text-amber-300 font-bold mt-1">
                                        First Checked In: {format(new Date(scanResult.checked_in_at), "dd MMM, h:mm a")}
                                    </p>
                                )}
                            </div>
                            <p className="text-xs text-amber-300 font-medium">This ticket pass has already been used for entry.</p>
                        </div>
                        <Button onClick={resetScanner} variant="secondary" fullWidth size="lg">
                            <RotateCcw className="w-4 h-4" /> Scan Next Attendee
                        </Button>
                    </div>
                )}

                {/* INVALID QR (FAILED TICKET) */}
                {state === "invalid" && (
                    <div className="w-full max-w-sm space-y-4">
                        <div className="rounded-3xl bg-red-950/90 border-2 border-red-600 p-6 text-center shadow-2xl space-y-3">
                            <div className="w-16 h-16 mx-auto bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center">
                                <XCircle className="w-10 h-10 text-red-400" />
                            </div>
                            <p className="text-red-300 font-black text-xl tracking-wide uppercase">INVALID TICKET PASS</p>
                            <p className="text-slate-200 text-xs font-semibold">Registration record not found in system.</p>
                            <p className="text-slate-400 text-xs">This QR pass is invalid, expired, or corrupted.</p>
                        </div>
                        <Button onClick={resetScanner} variant="secondary" fullWidth size="lg">
                            <RotateCcw className="w-4 h-4" /> Try Again / Scan Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

