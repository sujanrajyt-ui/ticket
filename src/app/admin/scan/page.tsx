"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Camera, CameraOff, CheckCircle2, AlertTriangle, XCircle, RotateCcw } from "lucide-react";
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
    const isProcessing = useRef(false);

    const extractToken = (text: string): string => {
        try {
            const url = new URL(text);
            const parts = url.pathname.split("/");
            return parts[parts.length - 1] || text;
        } catch {
            return text.trim();
        }
    };

    const handleScan = useCallback(async (decodedText: string) => {
        if (isProcessing.current || state !== "scanning") return;
        isProcessing.current = true;

        const token = extractToken(decodedText);
        setCurrentToken(token);
        setState("loading");

        try {
            const res = await fetch(`/api/lookup?token=${encodeURIComponent(token)}`);
            const json = await res.json();

            if (!res.ok || !json.found) {
                setState("invalid");
                isProcessing.current = false;
                return;
            }

            setScanResult({
                name: json.name,
                usn: json.usn,
                registration_id: json.registration_id,
                checked_in: json.checked_in,
                checked_in_at: json.checked_in_at,
            });

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
    }, [state]);

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
                () => { } // errors during scanning are normal (frame without QR)
            );
            setCameraError(null);
        } catch (err) {
            if (err instanceof Error) {
                if (err.message.includes("permission") || err.message.includes("NotAllowed")) {
                    setCameraError("Camera permission denied. Please allow camera access in your browser settings and reload.");
                } else if (err.message.includes("NotFound") || err.message.includes("no camera")) {
                    setCameraError("No camera found on this device.");
                } else {
                    setCameraError("Could not start camera. Please try reloading the page.");
                }
            }
        }
    }, [handleScan]);

    const stopCamera = useCallback(async () => {
        if (scannerInstanceRef.current) {
            try {
                await scannerInstanceRef.current.stop();
                scannerInstanceRef.current.clear();
            } catch { /* ignore */ }
            scannerInstanceRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (state === "scanning" && !cameraError) {
            startCamera();
        }
        return () => { stopCamera(); };
    }, []); // eslint-disable-line

    const handleCheckIn = async () => {
        if (!currentToken || !scanResult) return;
        setCheckingIn(true);

        try {
            const res = await fetch("/api/checkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: currentToken }),
            });

            if (!res.ok && res.status !== 200) {
                const json = await res.json();
                if (json.message === "ALREADY_CHECKED_IN") {
                    setState("already_checked_in");
                    return;
                }
                setCameraError("Check-in failed. Please try again.");
                setState("scanning");
                await startCamera();
                return;
            }

            const json = await res.json();

            if (json.success || json.message === "SUCCESS") {
                setCheckInTime(format(new Date(), "h:mm a"));
                setState("checked_in_success");
            } else if (json.message === "ALREADY_CHECKED_IN") {
                setState("already_checked_in");
                setScanResult({ ...scanResult, checked_in_at: json.attendee_data?.checked_in_at });
            } else {
                setState("invalid");
            }
        } catch {
            setCameraError("Network error during check-in. The check-in was NOT recorded.");
            setState("scanning");
            await startCamera();
        } finally {
            setCheckingIn(false);
            isProcessing.current = false;
        }
    };

    const resetScanner = async () => {
        setState("scanning");
        setScanResult(null);
        setCurrentToken(null);
        setCheckInTime(null);
        isProcessing.current = false;
        await startCamera();
    };

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                <button
                    onClick={() => { stopCamera(); router.push("/admin"); }}
                    className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Dashboard
                </button>
                <h1 className="text-sm font-bold text-white">QR Scanner</h1>
                <div className="w-20" />
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-4">
                {/* SCANNING STATE */}
                {(state === "scanning" || state === "loading") && (
                    <div className="w-full max-w-sm">
                        {cameraError ? (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 mx-auto bg-red-950 border border-red-800 rounded-2xl flex items-center justify-center">
                                    <CameraOff className="w-8 h-8 text-red-400" />
                                </div>
                                <p className="text-red-400 font-semibold">Camera Error</p>
                                <p className="text-gray-400 text-sm">{cameraError}</p>
                                <Button onClick={() => { setCameraError(null); startCamera(); }} variant="secondary">
                                    Try Again
                                </Button>
                            </div>
                        ) : (
                            <>
                                <p className="text-center text-gray-400 text-sm mb-4 flex items-center justify-center gap-2">
                                    <Camera className="w-4 h-4" />
                                    {state === "loading" ? "Reading QR…" : "Point camera at attendee's QR code"}
                                </p>
                                {/* Scanner container */}
                                <div
                                    id="qr-scanner-container"
                                    ref={scannerRef}
                                    className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-900 border-2 border-violet-800 relative"
                                >
                                    {state === "loading" && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                            <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-center text-xs text-gray-600 mt-3">
                                    Align the QR code within the frame
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* VALID (not yet checked in) */}
                {state === "valid" && scanResult && (
                    <div className="w-full max-w-sm animate-slide-up">
                        <div className="rounded-2xl bg-emerald-950/60 border-2 border-emerald-700 p-6 text-center mb-4">
                            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
                            <p className="text-emerald-300 font-bold text-lg tracking-wide">VALID REGISTRATION</p>
                            <p className="text-white font-semibold text-xl mt-2">{scanResult.name}</p>
                            <p className="text-gray-400 text-sm mt-1">{scanResult.usn}</p>
                            <p className="text-gray-500 text-xs mt-1">{scanResult.registration_id}</p>
                        </div>
                        <div className="space-y-3">
                            <Button onClick={handleCheckIn} fullWidth size="lg" loading={checkingIn}
                                className="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40 shadow-lg">
                                <CheckCircle2 className="w-5 h-5" />
                                CHECK IN
                            </Button>
                            <Button onClick={resetScanner} variant="ghost" fullWidth>
                                <RotateCcw className="w-4 h-4" /> Scan Another
                            </Button>
                        </div>
                    </div>
                )}

                {/* CHECKED IN SUCCESS */}
                {state === "checked_in_success" && scanResult && (
                    <div className="w-full max-w-sm animate-slide-up">
                        <div className="rounded-2xl bg-emerald-950/80 border-2 border-emerald-600 p-6 text-center mb-4">
                            <div className="w-16 h-16 mx-auto mb-3 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            </div>
                            <p className="text-emerald-300 font-bold text-xl tracking-wide">CHECK-IN SUCCESSFUL</p>
                            <p className="text-white font-semibold text-lg mt-2">{scanResult.name}</p>
                            <p className="text-emerald-400/80 text-sm mt-2">Entry recorded at {checkInTime}</p>
                        </div>
                        <Button onClick={resetScanner} fullWidth size="lg">
                            <Camera className="w-4 h-4" /> Scan Next
                        </Button>
                    </div>
                )}

                {/* ALREADY CHECKED IN */}
                {state === "already_checked_in" && scanResult && (
                    <div className="w-full max-w-sm animate-slide-up">
                        <div className="rounded-2xl bg-amber-950/60 border-2 border-amber-700 p-6 text-center mb-4">
                            <AlertTriangle className="w-14 h-14 text-amber-400 mx-auto mb-3" />
                            <p className="text-amber-300 font-bold text-lg tracking-wide">ALREADY CHECKED IN</p>
                            <p className="text-white font-semibold text-xl mt-2">{scanResult.name}</p>
                            <p className="text-gray-400 text-sm mt-1">{scanResult.registration_id}</p>
                            {scanResult.checked_in_at && (
                                <p className="text-amber-400/80 text-sm mt-3">
                                    Original check-in: {format(new Date(scanResult.checked_in_at), "dd MMM, h:mm a")}
                                </p>
                            )}
                            <p className="text-gray-500 text-xs mt-2">Duplicate entry blocked.</p>
                        </div>
                        <Button onClick={resetScanner} variant="secondary" fullWidth size="lg">
                            <RotateCcw className="w-4 h-4" /> Scan Another
                        </Button>
                    </div>
                )}

                {/* INVALID QR */}
                {state === "invalid" && (
                    <div className="w-full max-w-sm animate-slide-up">
                        <div className="rounded-2xl bg-red-950/60 border-2 border-red-700 p-6 text-center mb-4">
                            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-3" />
                            <p className="text-red-300 font-bold text-lg tracking-wide">INVALID QR</p>
                            <p className="text-gray-400 text-sm mt-2">Registration not found.</p>
                            <p className="text-gray-500 text-xs mt-1">This QR code is not registered in the system.</p>
                        </div>
                        <Button onClick={resetScanner} variant="secondary" fullWidth size="lg">
                            <RotateCcw className="w-4 h-4" /> Try Again
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
