export const EVENT_CONFIG = {
  name: "NITTE'S GOT LATENT",
  tagline: "Showcase Your Hidden Talent on Stage",
  collegeName: "NMAM Institute of Technology, Nitte",
  department: "VISTA 2025",
  description: "The cultural & talent showcase at NMAMIT Nitte. Register to claim your official digital entry ticket pass.",
  date: "15th March 2025",
  time: "05:00 PM Onwards",
  venue: "Sadananda Auditorium, NMAMIT Campus",
  contactEmail: "latent@nitte.edu.in",
  usnRegex: /^[1-4][A-Z]{2}\d{2}[A-Z]{2}\d{3}$/i,
  usnHelperText: "Enter your official USN (e.g. 4NM22CS001)",
  checkDuplicateEmail: true,
  checkDuplicatePhone: true,
  checkDuplicateUsn: true,
  branches: [
    "Computer Science & Engg (CSE)",
    "Information Science (ISE)",
    "Electronics & Comm (ECE)",
    "Electrical & Electronics (EEE)",
    "Mechanical Engineering (ME)",
    "Civil Engineering (CIV)",
    "Artificial Intelligence & DS (AIDS)",
    "Biotechnology (BT)",
    "Robotics & Automation (RA)",
    "Other",
  ],
  years: ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate"],
};

export interface EventSettings {
  name: string;
  tagline: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  collegeName: string;
  department: string;
  contactEmail: string;
}

export const EDITABLE_EVENT_FIELDS = [
  "name",
  "tagline",
  "description",
  "date",
  "time",
  "venue",
  "collegeName",
  "department",
  "contactEmail",
] as const;

export const DEFAULT_EVENT_SETTINGS: EventSettings = {
  name: EVENT_CONFIG.name,
  tagline: EVENT_CONFIG.tagline,
  description: EVENT_CONFIG.description,
  date: EVENT_CONFIG.date,
  time: EVENT_CONFIG.time,
  venue: EVENT_CONFIG.venue,
  collegeName: EVENT_CONFIG.collegeName,
  department: EVENT_CONFIG.department,
  contactEmail: EVENT_CONFIG.contactEmail,
};

export function mergeEventSettings(stored?: Partial<EventSettings> | null): EventSettings {
  return { ...DEFAULT_EVENT_SETTINGS, ...(stored || {}) };
}
