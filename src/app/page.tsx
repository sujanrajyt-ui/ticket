"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Calendar, Clock, MapPin, Ticket, ArrowRight
} from "lucide-react";
import { EVENT_CONFIG, compileUSNRegex } from "@/config/event";
import { useEventConfig } from "@/components/EventConfigProvider";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

type FormData = {
  first_name: string;
  last_name: string | undefined;
  email: string;
  phone: string;
  usn: string | undefined;
  branch: string;
  year: string;
};

export default function RegistrationPage() {
  const router = useRouter();
  const { settings } = useEventConfig();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);

  const schema = useMemo(() => {
    const usnRegex = compileUSNRegex(settings.usnRegex);
    let usnBase = z.string().max(50);
    if (settings.usnRequired && !usnRegex) {
      usnBase = z.string().min(1, "USN / ID is required").max(50);
    }
    if (usnRegex) {
      usnBase = z
        .string()
        .regex(usnRegex, "Invalid USN / ID format")
        .max(50);
    }
    const usn = settings.usnRequired
      ? usnBase
      : usnBase.optional().or(z.literal(""));

    return z.object({
      first_name: z.string().min(1, "First name is required").max(50),
      last_name: settings.lastNameRequired
        ? z.string().min(1, "Last name is required").max(50)
        : z.string().max(50).optional(),
      email: z.string().email("Enter a valid email address"),
      phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
      usn,
      branch: z.string().min(1, "Please select your branch"),
      year: z.string().min(1, "Please select your year of study"),
    });
  }, [settings]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      usn: "",
      branch: settings.branches[0] || EVENT_CONFIG.branches[0],
      year: EVENT_CONFIG.years[2],
    },
  });

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
          Object.entries(json.errors as Record<string, string>).forEach(([field, msg]) => {
            setError(field as keyof FormData, { message: msg });
          });
        } else {
          setServerError(json.error || "Registration failed. Please try again.");
        }
        return;
      }

      router.push(`/success/${json.qr_token}`);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToRegister = () => {
    document.getElementById("register-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleViewPass = async () => {
    const phone = phoneInput.trim().replace(/\D/g, "");
    if (phone.length !== 10) {
      setPhoneError("Enter a valid 10-digit mobile number.");
      phoneRef.current?.focus();
      return;
    }
    setPhoneError(null);
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/lookup-by-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!res.ok) { setPhoneError(json.error || "Not found."); return; }
      router.push(`/success/${json.qr_token}`);
    } catch {
      setPhoneError("Network error. Please try again.");
    } finally {
      setPhoneLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0516] text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* HERO SECTION */}
      <section className="relative pt-8 pb-16 px-4 overflow-hidden">
        {/* Subtle curtain backdrop highlight */}
        <div className="absolute inset-0 bg-radial from-purple-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          {/* Official Event Poster Display */}
          <div className="relative mx-auto max-w-4xl rounded-3xl overflow-hidden border-2 border-[#3b1a6e] shadow-2xl shadow-purple-950/80 bg-[#140929]">
            <Image
              src="/poster.png"
              alt="NITTE'S GOT LATENT Official Event Poster"
              width={1200}
              height={400}
              priority
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Hero Titles & Meta */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {settings.name}
            </h1>
            {settings.tagline && (
              <p className="text-amber-400 text-sm sm:text-base font-semibold tracking-wide">
                {settings.tagline}
              </p>
            )}
            {settings.description && (
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {settings.description}
              </p>
            )}
          </div>

          {/* Event Quick Meta Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto pt-2">
            <div className="bg-[#150a29] border border-[#2e1457] rounded-2xl p-4 flex items-center gap-3.5 text-left">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Event Date</p>
                <p className="text-sm font-extrabold text-white truncate">{settings.date}</p>
              </div>
            </div>

            <div className="bg-[#150a29] border border-[#2e1457] rounded-2xl p-4 flex items-center gap-3.5 text-left">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Timings</p>
                <p className="text-sm font-extrabold text-white truncate">{settings.time}</p>
              </div>
            </div>

            <div className="bg-[#150a29] border border-[#2e1457] rounded-2xl p-4 flex items-center gap-3.5 text-left">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Venue</p>
                <p className="text-sm font-extrabold text-white truncate" title={settings.venue}>{settings.venue}</p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={scrollToRegister} size="lg" className="px-8 py-4 text-base">
              REGISTER / GET YOUR TICKET <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* REGISTRATION FORM SECTION */}
      <section id="register-form" className="py-16 px-4 border-t border-[#231045] bg-[#0c0516] scroll-mt-20">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <Badge variant="gold">OFFICIAL REGISTRATION</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">CLAIM YOUR TICKET PASS</h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Fill in your details below to generate your official digital QR entry ticket pass.
            </p>
          </div>

          <div className="bg-[#150a29] border-2 border-[#3b1a6e] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {serverError && (
              <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-semibold">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="e.g. Rahul"
                  error={errors.first_name?.message}
                  required
                  autoComplete="given-name"
                  {...register("first_name")}
                />
                <Input
                  label="Last Name"
                  placeholder="e.g. Sharma"
                  error={errors.last_name?.message}
                  required={settings.lastNameRequired}
                  autoComplete="family-name"
                  {...register("last_name")}
                />
              </div>

              <Input
                label={settings.usnLabel}
                placeholder="e.g. 4NM22CS001"
                hint={settings.usnHint}
                error={errors.usn?.message}
                required={settings.usnRequired}
                autoComplete="off"
                autoCapitalize="characters"
                {...register("usn")}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Branch <span className="text-amber-400">*</span>
                  </label>
                  <select
                    {...register("branch")}
                    className="w-full bg-[#120721] border border-[#2b144e] rounded-xl px-3.5 py-3 text-base text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    {settings.branches.map((b) => (
                      <option key={b} value={b} className="bg-[#120721] text-white">{b}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Year of Study <span className="text-amber-400">*</span>
                  </label>
                  <select
                    {...register("year")}
                    className="w-full bg-[#120721] border border-[#2b144e] rounded-xl px-3.5 py-3 text-base text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    {EVENT_CONFIG.years.map((y) => (
                      <option key={y} value={y} className="bg-[#120721] text-white">{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Email Address"
                type="email"
                placeholder="rahul@nitte.edu.in"
                error={errors.email?.message}
                required
                autoComplete="email"
                {...register("email")}
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="9876543210"
                error={errors.phone?.message}
                required
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                {...register("phone")}
              />

              <div className="pt-2">
                <Button type="submit" fullWidth size="lg" loading={isSubmitting} className="py-4 text-base">
                  GET ENTRY PASS <Ticket className="w-5 h-5 ml-1" />
                </Button>
              </div>

              <p className="text-[11px] text-center text-slate-400">
                🔒 Official registration for {settings.collegeName}. No registration fee required.
              </p>
            </form>
          </div>

          {/* View Existing Pass */}
          <div className="bg-[#100820] border border-[#2e1457] rounded-3xl p-5 space-y-3">
            <div className="text-center">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Already Registered?</p>
              <p className="text-slate-400 text-xs mt-0.5">Enter your mobile number to view your existing pass</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  ref={phoneRef}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phoneInput}
                  onChange={(e) => { setPhoneInput(e.target.value.replace(/\D/g, "")); setPhoneError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleViewPass()}
                  className="w-full bg-[#120721] border border-[#2b144e] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                onClick={handleViewPass}
                disabled={phoneLoading}
                className="flex-shrink-0 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-extrabold text-xs rounded-xl px-4 py-2.5 transition-colors"
              >
                {phoneLoading ? "…" : "View Pass"}
              </button>
            </div>
            {phoneError && <p className="text-red-400 text-xs font-semibold text-center">{phoneError}</p>}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#231045] bg-[#0a0412] py-8 text-center text-xs text-slate-500 space-y-2">
        <p className="font-bold text-slate-400">{settings.name} • {settings.department}</p>
        <p>{settings.collegeName}, Karkala, Karnataka</p>
      </footer>
    </div>
  );
}
