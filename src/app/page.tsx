"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Calendar, Clock, MapPin, Sparkles, CheckCircle2, Ticket,
  QrCode, ShieldCheck, ArrowRight, Building2, User, Mail, Phone, Hash, Award, HelpCircle
} from "lucide-react";
import { EVENT_CONFIG } from "@/config/event";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

const schema = z.object({
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  usn: EVENT_CONFIG.usnRegex
    ? z.string().regex(EVENT_CONFIG.usnRegex, "Invalid USN format. Example: 4NM22CS001")
    : z.string().min(1, "USN is required"),
  branch: z.string().min(1, "Please select your branch"),
  year: z.string().min(1, "Please select your year of study"),
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
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      usn: "",
      branch: EVENT_CONFIG.branches[0],
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

  return (
    <div className="min-h-screen bg-[#0c0516] text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Header / Navbar */}
      <header className="border-b border-[#241047] bg-[#0c0516]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-sm">
              <Ticket className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="font-black tracking-tight text-white text-base sm:text-lg block leading-tight">
                NITTE'S GOT <span className="text-amber-400">LATENT</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">NMAMIT Nitte • VISTA 2025</span>
            </div>
          </div>
          <Button onClick={scrollToRegister} size="sm" variant="primary">
            Get Ticket Pass
          </Button>
        </div>
      </header>

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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e0e38] border border-[#3b1a6e] text-amber-400 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Official Cultural Stage Competition
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
              SHOWCASE YOUR TALENT ON THE <span className="text-amber-400">ULTIMATE STAGE</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              The premier stage event of NMAM Institute of Technology, Nitte. Join us at Sadananda Auditorium for an electrifying showcase of talent. Claim your official digital entry pass below!
            </p>
          </div>

          {/* Event Quick Meta Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto pt-2">
            <div className="bg-[#150a29] border border-[#2e1457] rounded-2xl p-4 flex items-center gap-3.5 text-left">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Event Date</p>
                <p className="text-sm font-extrabold text-white">{EVENT_CONFIG.date}</p>
              </div>
            </div>

            <div className="bg-[#150a29] border border-[#2e1457] rounded-2xl p-4 flex items-center gap-3.5 text-left">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Timings</p>
                <p className="text-sm font-extrabold text-white">{EVENT_CONFIG.time}</p>
              </div>
            </div>

            <div className="bg-[#150a29] border border-[#2e1457] rounded-2xl p-4 flex items-center gap-3.5 text-left">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Venue</p>
                <p className="text-sm font-extrabold text-white truncate">Sadananda Auditorium</p>
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

      {/* ABOUT & DETAILS */}
      <section className="py-12 border-t border-[#231045] bg-[#0f061c]">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <Badge variant="gold">ABOUT THE EVENT</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              WHAT IS <span className="text-amber-400">NITTE'S GOT LATENT?</span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              NITTE'S GOT LATENT is the premier talent competition organized as part of VISTA 2025 at NMAMIT Nitte. Designed to discover and celebrate unique stage performances, comedy, music, drama, and extraordinary skills among college students.
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 pt-2">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Live stage performances judged by special guests</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Instant QR ticket check-in at Sadananda Auditorium</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Open for all NMAMIT students & registered attendees</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#150a29] border border-[#2e1457] rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" /> Event Highlights & Guidelines
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-[#1b0d36] border border-[#341663]">
                <p className="font-bold text-white mb-0.5">Contactless QR Entry</p>
                <p className="text-slate-400">Show your unique QR ticket pass on your phone screen at the venue gate for instant check-in.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#1b0d36] border border-[#341663]">
                <p className="font-bold text-white mb-0.5">Seating & Timings</p>
                <p className="text-slate-400">Gates open at 04:30 PM. Please be seated in Sadananda Auditorium by 04:45 PM.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#1b0d36] border border-[#341663]">
                <p className="font-bold text-white mb-0.5">Student ID Requirement</p>
                <p className="text-slate-400">Carry your college ID card along with your digital ticket pass.</p>
              </div>
            </div>
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
                  {...register("first_name")}
                />
                <Input
                  label="Last Name"
                  placeholder="e.g. Sharma"
                  error={errors.last_name?.message}
                  required
                  {...register("last_name")}
                />
              </div>

              <Input
                label="USN (University Seat No)"
                placeholder="e.g. 4NM22CS001"
                hint={EVENT_CONFIG.usnHelperText}
                error={errors.usn?.message}
                required
                {...register("usn")}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Branch <span className="text-amber-400">*</span>
                  </label>
                  <select
                    {...register("branch")}
                    className="w-full bg-[#120721] border border-[#2b144e] rounded-xl px-3.5 py-3 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    {EVENT_CONFIG.branches.map((b) => (
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
                    className="w-full bg-[#120721] border border-[#2b144e] rounded-xl px-3.5 py-3 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                {...register("email")}
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="9876543210"
                error={errors.phone?.message}
                required
                {...register("phone")}
              />

              <div className="pt-2">
                <Button type="submit" fullWidth size="lg" loading={isSubmitting} className="py-4 text-base">
                  GENERATE MY ENTRY PASS <Ticket className="w-5 h-5 ml-1" />
                </Button>
              </div>

              <p className="text-[11px] text-center text-slate-400">
                🔒 Official registration for NMAMIT Nitte students. No registration fee required.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-12 px-4 border-t border-[#231045] bg-[#0f061c]">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">HOW IT WORKS</h2>
            <p className="text-slate-400 text-xs sm:text-sm">3 simple steps to get inside Sadananda Auditorium</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#150a29] border border-[#2e1457] rounded-2xl p-5 text-center space-y-3">
              <div className="w-10 h-10 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 font-extrabold">
                1
              </div>
              <h3 className="font-extrabold text-white text-sm">Register Online</h3>
              <p className="text-xs text-slate-400">Enter your name, USN, branch, and contact details above.</p>
            </div>

            <div className="bg-[#150a29] border border-[#2e1457] rounded-2xl p-5 text-center space-y-3">
              <div className="w-10 h-10 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 font-extrabold">
                2
              </div>
              <h3 className="font-extrabold text-white text-sm">Get Digital QR Pass</h3>
              <p className="text-xs text-slate-400">Your unique QR entry ticket pass will be generated instantly.</p>
            </div>

            <div className="bg-[#150a29] border border-[#2e1457] rounded-2xl p-5 text-center space-y-3">
              <div className="w-10 h-10 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 font-extrabold">
                3
              </div>
              <h3 className="font-extrabold text-white text-sm">Scan & Enter</h3>
              <p className="text-xs text-slate-400">Show the QR code at the auditorium entrance for instant check-in.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#231045] bg-[#0a0412] py-8 text-center text-xs text-slate-500 space-y-2">
        <p className="font-bold text-slate-400">NITTE'S GOT LATENT • VISTA 2025</p>
        <p>NMAM Institute of Technology, Nitte, Karkala, Karnataka</p>
        <p className="text-[11px] text-slate-600">Need help? Email <a href="mailto:latent@nitte.edu.in" className="text-amber-400 hover:underline">latent@nitte.edu.in</a></p>
      </footer>
    </div>
  );
}
