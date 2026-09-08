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
  usnLabel: string;
  usnHint: string;
  usnRegex: string;
  usnRequired: boolean;
  lastNameRequired: boolean;
}

export interface EventSettingField {
  key: keyof EventSettings;
  label: string;
  type: "text" | "textarea" | "boolean";
  hint?: string;
}

export const EVENT_SETTING_FIELDS: EventSettingField[] = [
  { key: "name", label: "Event Name", type: "text" },
  { key: "tagline", label: "Tagline", type: "text" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "date", label: "Event Date", type: "text" },
  { key: "time", label: "Event Time", type: "text" },
  { key: "venue", label: "Venue", type: "text" },
  { key: "collegeName", label: "College Name", type: "text" },
  { key: "department", label: "Department / Fest", type: "text" },
  { key: "contactEmail", label: "Contact Email", type: "text" },
  {
    key: "usnLabel",
    label: "USN Field Label",
    type: "text",
    hint: "Shown above the ID input on the registration form.",
  },
  {
    key: "usnHint",
    label: "USN Helper Text",
    type: "text",
    hint: "The hint shown below the ID input.",
  },
  {
    key: "usnRegex",
    label: "USN Format Pattern",
    type: "text",
    hint: "Leave empty to accept any format. JavaScript Regex, e.g. ^[1-4][A-Z]{2}\\d{2}[A-Z]{2}\\d{3}$",
  },
  {
    key: "usnRequired",
    label: "USN / ID Field Required",
    type: "boolean",
    hint: "Turn off to let attendees skip the USN / ID field.",
  },
  {
    key: "lastNameRequired",
    label: "Last Name Required",
    type: "boolean",
    hint: "Turn off to make last name optional on registration.",
  },
];

export const EDITABLE_EVENT_FIELDS = EVENT_SETTING_FIELDS.map((f) => f.key);

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
  usnLabel: "USN / Student ID",
  usnHint: "Enter your USN (any format is accepted)",
  usnRegex: "",
  usnRequired: true,
  lastNameRequired: false,
};

export function mergeEventSettings(stored?: Partial<EventSettings> | null): EventSettings {
  return { ...DEFAULT_EVENT_SETTINGS, ...(stored || {}) };
}

export function compileUSNRegex(pattern?: string): RegExp | null {
  if (!pattern || !pattern.trim()) return null;
  try {
    return new RegExp(pattern.trim());
  } catch {
    return null;
  }
}
