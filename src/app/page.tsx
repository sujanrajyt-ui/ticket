"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Clock, Sparkles, ChevronRight, QrCode, ShieldCheck, Zap } from "lucide-react";
import { EVENT_CONFIG } from "@/config/event";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const schema = z.object({
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  usn: EVENT_CONFIG.usnRegex
    ? z.string().regex(EVENT_CONFIG.usnRegex, "Invalid USN format. Example: 1RV22CS001")
    : z.string().min(1, "USN is required"),
});

type FormData = z.infer<typeof schema>;

export default function RegistrationPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.errors) {
          Object.entries(json.errors).forEach(([field, msg]) => {
            setError(field as keyof FormData, { message: msg as string });
          });
        } else {
          setServerError(json.error || "Something went wrong. Please try again.");
        }
        return;
      }

      sessionStorage.setItem(`reg_${json.qr_token}`, JSON.stringify(json.attendee));
      router.push(`/success/${json.qr_token}`);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white relative overflow-x-hidden">
      {/* Dynamic ambient lights */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-4 py-8 sm:py-12">
        {/* Top QR-Sage Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-violet-950/80 border border-violet-500/30 text-violet-300 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase shadow-lg shadow-violet-950/50">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
            <QrCode className="w-3.5 h-3.5 text-violet-400" />
            QR SAGE TICKET PASS REGISTRATION
          </div>
        </div>

        {/* ── Event Hero Banner Card ── */}
        <div className="rounded-3xl overflow-hidden mb-8 border border-white/10 shadow-2xl bg-gray-900">
          <div className="bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950 px-6 pt-8 pb-6 text-center relative border-b border-white/10">
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
                backgroundSize: "24px 24px"
              }}
            />
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-xl">
                <Sparkles className="w-8 h-8 text-violet-300" />
              </div>
              <p className="text-violet-300 text-xs font-bold tracking-[0.25em] uppercase mb-2">
                {EVENT_CONFIG.collegeName}
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 leading-tight tracking-tight">
                {EVENT_CONFIG.name}
              </h1>
              <p className="text-base text-violet-200 font-medium mb-3">
                {EVENT_CONFIG.tagline}
              </p>
              <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
                {EVENT_CONFIG.description}
              </p>
            </div>
          </div>

          {/* Event details strip */}
          <div className="bg-gray-900/90 px-6 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-300">
              <span className="flex items-center gap-1.5 font-medium">
                <CalendarDays className="w-4 h-4 text-violet-400" />
                {EVENT_CONFIG.date}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-violet-400" />
                {EVENT_CONFIG.time}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-violet-400" />
                {EVENT_CONFIG.venue}
              </span>
            </div>
          </div>
        </div>

        {/* Feature Highlights Row */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-3">
            <Zap className="w-4 h-4 text-violet-400 mx-auto mb-1" />
            <p className="text-[11px] font-semibold text-white">Instant QR Pass</p>
            <p className="text-[9px] text-gray-500">Instant download</p>
          </div>
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-[11px] font-semibold text-white">Contactless</p>
            <p className="text-[9px] text-gray-500">Fast check-in</p>
          </div>
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-3">
            <QrCode className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <p className="text-[11px] font-semibold text-white">Digital Ticket</p>
            <p className="text-[9px] text-gray-500">Phone entry</p>
          </div>
        </div>

        {/* ── Registration Form Card ── */}
        <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Claim Your Free Entry Ticket</h2>
              <p className="text-xs text-gray-400 mt-1">
                Fill in your details to generate your unique entry QR pass.
              </p>
            </div>
            <span className="bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              FREE ENTRY
            </span>
          </div>

          {serverError && (
            <div className="mb-5 flex gap-3 items-start bg-red-950/50 border border-red-800/80 rounded-2xl p-4">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-red-300">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                required
                placeholder="Rahul"
                error={errors.first_name?.message}
                {...register("first_name")}
              />
              <Input
                label="Last Name"
                required
                placeholder="Sharma"
                error={errors.last_name?.message}
                {...register("last_name")}
              />
            </div>

            <Input
              label="Email Address"
              required
              type="email"
              placeholder="rahul@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Phone Number <span className="text-violet-400">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 text-xs text-gray-300 font-semibold min-w-[72px] flex-shrink-0">
                  🇮🇳 +91
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="9876543210"
                  maxLength={10}
                  className={`flex-1 bg-white/5 border rounded-xl px-3.5 py-3 text-white text-sm placeholder:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 hover:border-white/20 ${errors.phone ? "border-red-500 focus:ring-red-500" : "border-white/10"}`}
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.phone.message}
                </p>
              )}
            </div>

            <Input
              label="USN (University Seat Number)"
              required
              placeholder="1RV22CS001"
              helperText={EVENT_CONFIG.usnHelperText}
              error={errors.usn?.message}
              {...register("usn")}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isSubmitting}
              className="mt-2 shadow-lg shadow-violet-950/50"
            >
              {isSubmitting ? "Generating QR Pass..." : "Get My Ticket Pass"}
              {!isSubmitting && <ChevronRight className="w-4 h-4" />}
            </Button>
          </form>

          <p className="text-[11px] text-gray-500 text-center mt-5">
            Free Pass · Organized by {EVENT_CONFIG.department}
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          {EVENT_CONFIG.contactEmail}
        </p>
      </div>
    </main>
  );
}
