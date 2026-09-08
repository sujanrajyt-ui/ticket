// ============================================================
// EVENT CONFIGURATION — Edit this file to customise your event
// ============================================================

export const EVENT_CONFIG = {
  // Basic info
  name: "TechFest 2025",
  tagline: "Annual Technical Extravaganza",
  description:
    "Join us for an exciting day of innovation, competition, and networking. Register now to secure your free entry.",

  // Date & venue
  date: "15 November 2025",
  time: "9:00 AM – 5:00 PM",
  venue: "Main Auditorium, College Campus",

  // Organiser
  collegeName: "Your College Name",
  department: "Department of Computer Science & Engineering",

  // Theme colour (used in banner gradient — Tailwind class names)
  // Options: "from-violet-900 via-purple-900 to-indigo-900"
  //          "from-blue-900 via-cyan-900 to-teal-900"
  //          "from-rose-900 via-pink-900 to-fuchsia-900"
  gradientFrom: "from-violet-950",
  gradientVia: "via-purple-900",
  gradientTo: "to-indigo-900",

  // Accent colour for buttons / badges (Tailwind class names)
  accentBg: "bg-violet-600",
  accentHover: "hover:bg-violet-500",
  accentText: "text-violet-400",
  accentBorder: "border-violet-500",
  accentRing: "focus:ring-violet-500",

  // Registration settings
  // Duplicate check: block if same email OR phone OR USN already exists
  checkDuplicateEmail: true,
  checkDuplicatePhone: true,
  checkDuplicateUsn: true,

  // USN validation regex (VTU format: e.g. 1RV22CS001)
  // Set to null to skip USN format validation (just require non-empty)
  usnRegex: /^[1-9][A-Z]{2}\d{2}[A-Z]{2}\d{3}$/i,
  usnHelperText: "Enter your University Seat Number (USN). Example: 1RV22CS001",

  // Social / contact (optional, shown in footer)
  contactEmail: "events@yourcollege.edu",
  instagramHandle: "@yourcollege_events",
};

export type EventConfig = typeof EVENT_CONFIG;
