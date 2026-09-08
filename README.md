# College Event Registration & QR Check-in System

A private registration and QR check-in web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**. Built for college events and technical fests.

---

## Key Features

- **Attendee Registration**: Mobile-first registration form with India `+91` phone selector and USN validation.
- **Instant QR Code Generation**: Generates a downloadable QR code right after registration.
- **Secure QR Encoding**: Contains only a secure, randomly generated token URL (`/checkin/TOKEN`). No PII (Email, Phone, USN) is stored in the QR code.
- **Mobile QR Scanner**: Browser-based scanner using `html5-qrcode` that works on iOS & Android without an app.
- **Atomic Check-in & Concurrency**: Uses Postgres `FOR UPDATE` row locking to prevent duplicate check-ins across multiple scanners operating simultaneously.
- **Color-Coded Scanning Feedback**:
  - **VALID REGISTRATION** — Displays attendee name, USN, and a prominent "CHECK IN" button.
  - **CHECK-IN SUCCESSFUL** — Displays recorded timestamp.
  - **ALREADY CHECKED IN** — Displays original check-in time and blocks duplicate check-ins.
  - **INVALID QR** — Displays registration not found warning without leaking database info.
- **Role-Based Access Control**:
  - **Admin**: Dashboard stats, search, filters, manual check-in, undo check-in, CSV export, and event info editing.
  - **Volunteer**: QR scanner and minimal attendee details required for verification.
- **Event Info Editor**: Edit event name, dates, venue, and contact info from the admin console at `/admin/settings`. Changes apply instantly to the public pages and ticket pass.
- **Manual Check-In**: Search and check in attendees if the QR cannot be scanned.
- **CSV Export**: Export registration data as CSV.
- **Central Event Configuration**: Set defaults for event details, dates, venues, and regex rules in `src/config/event.ts`.

---

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Event registration landing page
│   │   ├── success/[token]/page.tsx     # Confirmation page with QR download
│   │   ├── registration/[id]/page.tsx   # Public registration view page
│   │   ├── checkin/[token]/page.tsx     # QR code redirect handler
│   │   ├── checkin-info/[token]/page.tsx# Attendee status lookup
│   │   ├── admin/
│   │   │   ├── page.tsx                 # Admin dashboard with stats & table
│   │   │   ├── login/page.tsx           # Admin/Volunteer login page
│   │   │   ├── settings/page.tsx        # Event info editor
│   │   │   ├── scan/page.tsx            # Camera QR scanner
│   │   │   └── attendees/[id]/page.tsx  # Individual attendee details
│   │   └── api/
│   │       ├── register/route.ts        # Server-side registration & validation
│   │       ├── checkin/route.ts         # Atomic check-in RPC wrapper
│   │       ├── checkin/undo/route.ts    # Reset check-in status (Admin only)
│   │       ├── attendees/route.ts       # Attendee search & filter API
│   │       ├── attendees/[id]/route.ts  # Attendee detail API
│   │       ├── export/route.ts          # CSV export endpoint
│   │       ├── lookup/route.ts          # Token lookup API for scanner preview
│   │       └── admin/event-config/route.ts # Event settings read/update (Admin only)
│   ├── components/                      # Reusable UI components
│   │   ├── ui/                          # Button, Badge, Input, Modal
│   │   ├── admin/                       # StatsCard
│   │   └── EventConfigProvider.tsx      # Live event settings for client pages
│   ├── config/
│   │   └── event.ts                     # Central event default settings
│   ├── lib/
│   │   ├── qr.ts                        # QR code generation & download helpers
│   │   ├── event-config.ts              # Server-side event settings reader
│   │   ├── utils.ts                     # Tailwind class merge helper
│   │   └── supabase/                    # Browser, server, and proxy clients
│   ├── proxy.ts                         # Admin route protection
│   └── types/
│       └── database.ts                  # Supabase TypeScript interfaces
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql       # Tables, function & RLS policies
        └── 002_event_settings.sql       # Event info editor storage
```

---

## 🚀 Setup & Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project.
2. Note down your **Project URL**, **Anon Key**, and **Service Role Key** (found under Project Settings > API).

---

### 2. Run Database Migrations

1. Go to your Supabase Dashboard -> **SQL Editor**.
2. Click **New Query**.
3. Copy the contents of `supabase/migrations/001_initial_schema.sql` into the SQL Editor and click **Run**.
4. Repeat with `supabase/migrations/002_event_settings.sql`.

This creates:
- `attendees` table with indexes and unique constraints
- `profiles` table linked to `auth.users`
- `event_config` table used by the event info editor
- `check_in_attendee()` Postgres function with `FOR UPDATE` lock for atomic check-ins
- Row Level Security (RLS) policies

---

### 3. Setup Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### 4. Create Admin & Volunteer Accounts

#### Create Users in Supabase Auth
1. In Supabase Dashboard, go to **Authentication** -> **Users** -> **Add User** -> **Create User**.
2. Create an admin user (e.g., `admin@college.edu`) with a secure password.
3. Create volunteer user(s) (e.g., `volunteer1@college.edu`).

#### Assign Roles in `profiles` Table
In Supabase Dashboard -> **SQL Editor**, run:

```sql
-- Assign Admin Role
INSERT INTO public.profiles (id, role)
VALUES ('<ADMIN_USER_UUID_FROM_AUTH_USERS>', 'admin');

-- Assign Volunteer Role
INSERT INTO public.profiles (id, role)
VALUES ('<VOLUNTEER_USER_UUID_FROM_AUTH_USERS>', 'volunteer');
```

---

### 5. Customizing Event Details

Set default event details in `src/config/event.ts` (name, dates, venue, USN regex, branches):

```typescript
export const EVENT_CONFIG = {
  name: "TechFest 2025",
  tagline: "Annual Technical Extravaganza",
  description: "Join us for an exciting day of innovation...",
  date: "15 November 2025",
  time: "9:00 AM – 5:00 PM",
  venue: "Main Auditorium, College Campus",
  collegeName: "Your College Name",
  department: "Department of Computer Science & Engineering",
  usnRegex: /^[1-9][A-Z]{2}\d{2}[A-Z]{2}\d{3}$/i, // USN pattern validation
};
```

Admins can also edit name, tagline, description, date, time, venue, college name, department, and contact email at runtime from **Event Info Editor** (`/admin/settings`). Edits are stored in the `event_config` table and apply instantly.

---

### 6. Run Locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- Registration Page: `http://localhost:3000`
- Admin Login: `http://localhost:3000/admin/login`
- Scanner: `http://localhost:3000/admin/scan` (Login required)

---

### 7. Deploy to Vercel

1. Push code to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Add environment variables in Vercel settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (e.g., `https://your-app.vercel.app`)
4. Deploy!

---

## 🔒 Security Summary

- **No Public Service Keys**: `SUPABASE_SERVICE_ROLE_KEY` is strictly used inside server-side API routes (`src/lib/supabase/server.ts`).
- **Atomic Operations**: `check_in_attendee()` executes as a single SQL transaction using `FOR UPDATE` row locks, preventing double check-in race conditions.
- **Sanitized QR Payload**: QR codes encode only secure URLs containing random UUID tokens (`/checkin/<token>`). Personal data (Email, USN, Phone) is never stored inside QR payload.
- **Row Level Security**: Direct database updates/deletes on attendees require authenticated admin sessions.
