<div align="center">

# BookEase

### A full-stack booking & scheduling platform for service providers

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe)](https://stripe.com)

[Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [API Reference](#api-reference) · [Folder Structure](#folder-structure)

</div>

---

## Overview

BookEase is a production-ready booking and scheduling web application. Service providers register, set up their profile and services, define weekly availability, and share a public booking link with clients. Clients can browse available time slots, book appointments, and pay online via Stripe — all without needing an account.

---

## Features

### For Service Providers
- **Auth** — Register / sign in with email + password or Google OAuth
- **Profile setup** — Name, service type, bio, and custom booking URL slug
- **Service management** — Create services with name, duration (30 / 60 / 90 min), and price
- **Availability** — Set working hours per day of the week (e.g. Mon–Fri 9am–5pm)
- **Blocked slots** — Block specific dates or time ranges (vacations, lunch breaks)
- **Dashboard** — View all upcoming bookings in a list view
- **KPI cards** — Total bookings, revenue this month, confirmed count, cancellation rate
- **Cancel bookings** — Cancel any upcoming booking from the dashboard

### For Clients
- **Public booking page** — `/book/[slug]` — no account needed
- **Multi-step booking wizard** — Service → Date → Time → Details → Confirm
- **Stripe Checkout** — Secure card payment before the slot is confirmed
- **Pay on site** — Option to skip online payment and pay in person
- **Conflict detection** — Slots already booked are hidden in real time
- **Confirmation email** — Sent immediately after booking via Resend
- **Reminder email** — Sent 24 hours before the appointment
- **Cancel via email link** — Clients can cancel up to 24 h before the appointment

### Extra
- Fully **mobile-responsive** layout
- Toast notifications for every action
- Google Calendar OAuth integration — syncs confirmed bookings to provider's calendar
- Seed script with a complete demo provider, services, and sample bookings
- `.env.example` with all required keys documented

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | [TypeScript 5](https://typescriptlang.org) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com) |
| Database | [PostgreSQL](https://postgresql.org) via [Docker](https://docker.com) |
| ORM | [Prisma 6](https://prisma.io) |
| Auth | [NextAuth.js v4](https://next-auth.js.org) (Credentials + Google OAuth) |
| Payments | [Stripe Checkout](https://stripe.com/payments/checkout) + Webhooks |
| Email | [Resend](https://resend.com) |
| Calendar | [Google Calendar API](https://developers.google.com/calendar) |
| Icons | [Lucide React](https://lucide.dev) |
| Forms | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Toasts | [React Hot Toast](https://react-hot-toast.com) |

---

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [Docker](https://docker.com) (for the local PostgreSQL database)
- [Git](https://git-scm.com)

### 1 — Clone and install

```bash
git clone https://github.com/gripexdev/BookEase.git
cd BookEase
npm install
```

### 2 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values (see [Environment Variables](#environment-variables) below).

### 3 — Start the database

```bash
docker run -d \
  --name bookease-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=booking_app \
  -p 5432:5432 \
  postgres:16
```

### 4 — Push schema & seed demo data

```bash
npx prisma db push
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### 5 — Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Account

After seeding the database a demo provider is ready to use:

| Field | Value |
|---|---|
| Email | `demo@bookease.app` |
| Password | `password123` |
| Dashboard | http://localhost:3000/dashboard |
| Public booking page | http://localhost:3000/book/alex-thompson |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values below.

```env
# PostgreSQL (Docker default)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/booking_app?schema=public"

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# Google OAuth (https://console.cloud.google.com → APIs & Services → Credentials)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Stripe (https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Resend (https://resend.com/api-keys)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# Google Calendar API (optional)
GOOGLE_CALENDAR_CLIENT_ID=""
GOOGLE_CALENDAR_CLIENT_SECRET=""
GOOGLE_CALENDAR_REDIRECT_URI="http://localhost:3000/api/calendar/callback"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Stripe webhooks (local dev)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and forward events:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Paste the printed webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

---

## API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/auth/register` | — | Create a provider account |
| `GET` | `/api/availability?providerId=&date=&serviceId=` | — | Get available time slots for a date |
| `PUT` | `/api/availability` | Provider | Replace weekly availability |
| `GET` | `/api/bookings` | Provider | List all provider bookings |
| `POST` | `/api/bookings` | — | Create a booking (pay-on-site) |
| `PATCH` | `/api/bookings/[id]` | Provider / token | Cancel or reschedule |
| `POST` | `/api/bookings/[id]/cancel` | Cancel token | Client-side cancellation via email link |
| `POST` | `/api/services` | Provider | Add a service |
| `DELETE` | `/api/services/[id]` | Provider | Remove a service |
| `PATCH` | `/api/provider/profile` | Provider | Update profile & slug |
| `POST` | `/api/stripe/checkout` | — | Create Stripe Checkout session |
| `POST` | `/api/webhooks/stripe` | Stripe sig | Handle payment confirmation |
| `POST` | `/api/emails/reminder` | Cron secret | Send 24 h reminder emails |
| `GET` | `/api/calendar/connect` | Provider | Start Google Calendar OAuth |
| `GET` | `/api/calendar/callback` | — | Google Calendar OAuth callback |

---

## Folder Structure

```
BookEase/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── auth/register/        # Registration endpoint
│   │   ├── availability/         # Slot calculator + availability CRUD
│   │   ├── bookings/             # Booking CRUD + cancel
│   │   ├── calendar/             # Google Calendar OAuth
│   │   ├── emails/reminder/      # Cron-triggered 24h reminders
│   │   ├── provider/profile/     # Profile update
│   │   ├── services/             # Service CRUD
│   │   ├── stripe/checkout/      # Stripe Checkout session
│   │   └── webhooks/stripe/      # Stripe webhook handler
│   ├── book/
│   │   ├── [providerSlug]/       # Public booking page
│   │   ├── cancel/               # Booking cancellation page
│   │   └── confirm/              # Post-payment confirmation
│   ├── dashboard/
│   │   ├── page.tsx              # KPIs + upcoming bookings
│   │   └── settings/             # Profile, services, availability
│   ├── login/                    # Sign-in page
│   ├── register/                 # Registration page
│   ├── layout.tsx
│   ├── page.tsx                  # Landing page
│   └── providers.tsx             # SessionProvider + Toaster
├── components/
│   ├── booking/
│   │   └── BookingFlow.tsx       # Multi-step booking wizard
│   └── dashboard/
│       ├── DashboardClient.tsx   # KPI cards + booking list
│       ├── DashboardNav.tsx      # Top navigation bar
│       └── SettingsClient.tsx    # Profile / services / availability tabs
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── email.ts                  # Resend helpers (confirmation + reminder)
│   ├── googleCalendar.ts         # Google Calendar helpers
│   ├── prisma.ts                 # Prisma singleton
│   ├── stripe.ts                 # Stripe client
│   └── utils.ts                  # cn, formatCurrency, generateTimeSlots…
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Demo data seeder
├── types/
│   └── next-auth.d.ts            # Session type augmentation
├── .env.example
└── README.md
```

---

## Database Schema

```
User ──< Service ──< Booking
     ──< Availability
     ──< BlockedSlot
     ──< Account (OAuth)
     ──< Session
```

| Model | Key fields |
|---|---|
| `User` | id, name, email, password, role, slug, bio, serviceType |
| `Service` | id, name, duration, price, providerId |
| `Availability` | id, providerId, dayOfWeek, startTime, endTime |
| `BlockedSlot` | id, providerId, date, startTime, endTime |
| `Booking` | id, clientName, clientEmail, serviceId, startTime, endTime, status, paymentStatus, cancelToken |

---

## Email Reminders Cron

Set up a cron job to `POST /api/emails/reminder` every hour with:

```
Authorization: Bearer <CRON_SECRET>
```

**Vercel Cron** (`vercel.json`):

```json
{
  "crons": [{ "path": "/api/emails/reminder", "schedule": "0 * * * *" }]
}
```

---

## Deployment

```bash
# Build
npm run build

# Deploy to Vercel
vercel
```

Set all environment variables in your Vercel project settings. Create a production Stripe webhook pointing to `https://yourdomain.com/api/webhooks/stripe`.

---

<div align="center">
  Built with ❤️ using Next.js · Prisma · Stripe · Resend
</div>
