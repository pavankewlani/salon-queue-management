# Salon Queue Management System — Project Brief & Product Vision
**Document ID:** `DOC-01-BRIEF`  
**Version:** 1.0.0  
**Status:** Approved Specification  
**Design Theme:** Charcoal (`#1F2937`) & Gold (`#D4A017`)  
**Languages Supported:** English (en) & Gujarati (ગુજરાતી - gu)

---

## 1. Executive Summary & Vibe Coding Philosophy

The **Salon Queue Management System** is a modern, high-end digital queuing solution tailored for premier hair salons and grooming lounges. Inspired by the principles of modern *Vibe Coding*—crafting software that is effortlessly intuitive, aesthetically stunning, resilient, and human-centered—this system eradicates the traditional frictions of salon visits: crowded waiting lobbies, awkward physical inquiries, uncertain wait times, and barber scheduling disputes.

The system combines luxury aesthetics with real-time operational precision:
- **Aesthetic Excellence:** A rich, high-contrast dark charcoal (`#1F2937`) canvas crowned with metallic warm gold (`#D4A017`) accents, conveying sophistication, hygiene, and modern craftsmanship.
- **Bilingual Inclusivity:** Native parallel support for **English** and **Gujarati (ગુજરાતી)** across all user-facing interfaces, ensuring effortless accessibility for regional clientele and multilingual staff.
- **Synchronized Real-Time State:** Every screen—from customer smartphones to high-definition Waiting Area TV displays and Barber chair tablets—synchronizes within **less than 5 seconds** via real-time reactive event streaming.

---

## 2. Core Problem & Solution Strategy

### 2.1 The Traditional Salon Dilemma
1. **Unpredictable Physical Waits:** Clients arrive without visibility into queue length, resulting in either overcrowded waiting couches or abandoned visits.
2. **Barber Allocation Chaos:** Conflict between walk-ins and customers demanding specific stylists, often resulting in idle chairs or frustrated barbers.
3. **Ghost Bookings & No-Shows:** Clients take a verbal spot, step out for errands, and disappear, throwing off subsequent appointments.
4. **Service Scope Creep:** Clients ask for "just a haircut", then progressively add beard trim, hair spa, and facial midway through, destroying the salon's schedule for other waiting patrons.
5. **Language & Accessibility Friction:** Regional patrons in Gujarat often find pure-English interfaces intimidating, while salon stylists require straightforward, legible vernacular indicators.

### 2.2 The Solution Architecture
- **Controlled Self-Service Joining:** Clients join online or via salon kiosk; queue positions are strictly verified with phone number deduplication.
- **Disciplined Service Capping:** Clients select up to **a maximum of 3 services** during entry, allowing precise estimation of chair duration without schedule-wrecking scope creep.
- **Fair-Queueing Algorithm with Preference Flexibility:** Standard First-Come, First-Served (FCFS) fairness balanced with smart barber routing ("Any Available" vs. "Specific Barber").
- **Automated 10-Minute No-Show Escalation:** When a token is summoned to a chair, an automated 10-minute grace period initiates. If unclaimed, the token is forfeited and marked no-show; rejoining mandates acquiring a brand-new token at the tail of the line.
- **Closing Protection with Walk-in Flexibility:** Online queue access closes automatically **30 minutes prior to salon closing**, protecting staff from late backlogs while allowing the receptionist to manage physical walk-ins at their discretion.

---

## 3. User Personas & Target Audiences

| Persona | Role | Key Motivations | Primary Interface |
| :--- | :--- | :--- | :--- |
| **Rajesh / Priya** | Salon Customer | Wants to know exact wait time, step away for tea/groceries, and get served on time without waiting in line. | **Home, Join Queue, My Status** (Mobile Web) |
| **Kavita** | Receptionist | Needs a single control hub to greet walk-ins, resolve no-shows, seat guests, and monitor barber chairs. | **Reception Dashboard** (Desktop / Tablet) |
| **Amit / Vikram** | Barber / Stylist | Wants to see who is next in their chair, what exact services are requested, and avoid disputes over whose turn it is. | **Barber View** (Chairside Tablet / Mobile) |
| **Sanjay** | Salon Owner | Wants accurate throughput analytics, no-show trends, service revenue metrics, and smooth operational oversight. | **Owner Settings & Analytics** (Desktop / Mobile) |
| **Lounge Patrons** | Waiting Guests | Glanceable, high-contrast, audible display indicating who is being served and who is up next. | **Waiting Area TV** (Large 16:9 Display) |

---

## 4. Visual Identity & Design System

The visual design is grounded in the ambiance of an upscale bespoke grooming salon—warm, luxurious, calm, and impeccably organized.

```
+--------------------------------------------------------------------------+
|  COLOR PALETTE SPECIFICATION                                            |
|                                                                          |
|  [ #1F2937 ] Charcoal Slate      Primary canvas, rich contrast dark mode |
|  [ #111827 ] Deep Onyx           Cards, elevated containers, TV backdrop |
|  [ #D4A017 ] Metallic Gold       Brand accent, active states, CTA, badges|
|  [ #F59E0B ] Amber Gold          Warning, "Up Next" status, 10-min timer |
|  [ #10B981 ] Emerald Green       "Now Serving", Chair ready, Success     |
|  [ #EF4444 ] Crimson Red         No-Show, Cancelled, Closed alert        |
|  [ #F9FAFB ] Crisp White         Headings, high-emphasis text            |
|  [ #9CA3AF ] Muted Silver        Secondary captions, inactive states     |
+--------------------------------------------------------------------------+
```

### 4.1 Typography & Styling Principles
- **Latin Font Family:** Inter / Outfit (Modern geometric sans-serif for sleek legibility).
- **Gujarati Font Family:** Noto Sans Gujarati / Hind Vadodara (Clean, highly legible Gujarati typography matching Latin line heights).
- **Elevated Contrast:** Strict WCAG AAA compliance for critical queue numbers and token IDs to ensure immediate readability on Waiting Area TV screens from 25+ feet away.
- **Subtle Tactility:** Micro-transitions (200ms ease-out), soft gold glows (`box-shadow: 0 0 15px rgba(212, 160, 23, 0.25)`), and clean rounded cards (`border-radius: 12px`).

---

## 5. Bilingual Localization Strategy (English & Gujarati)

The system embeds native internationalization from day zero. A top-bar language switcher allows instantaneous toggling between English and Gujarati without reloading page state.

### 5.1 Key Terminology Mapping

| English Term | Gujarati Translation | Context / Usage |
| :--- | :--- | :--- |
| **Token Number** | ટોકન નંબર | Unique queue identifier (e.g., #G-14) |
| **Join Queue** | કતારમાં જોડાઓ | Primary customer intake CTA |
| **My Status** | મારું સ્ટેટસ | Live queue tracking page |
| **Now Serving** | હાલમાં સેવા શરૂ છે | Barber currently cutting hair / chair occupied |
| **Up Next** | આગળનો વારો | Customer currently on deck (prepare to arrive) |
| **Waiting** | રાહ જોઈ રહ્યા છે | Customer in queue line |
| **Estimated Wait** | અંદાજિત રાહ જોવાનો સમય | Dynamic calculation (minutes remaining) |
| **Any Available Barber**| કોઈપણ ઉપલબ્ધ હેર સ્ટાઈલિશ| Default fastest-turnaround queue option |
| **No-Show** | ગેરહાજર / આવ્યા નથી | Client failed to appear within 10-minute window |
| **Service Completed** | સેવા પૂર્ણ થઈ | Barber finishes chair service |
| **Walk-in Customer** | સીધા આવેલા ગ્રાહક | Intake done in-person by receptionist |
| **Queue Closed** | કતાર બંધ છે | Online intake blocked (30 min before closing) |

---

## 6. The Seven Core Screens

The product experience is structured across seven dedicated, responsive screens:

1. **Home Screen (`/`):** Salon welcome portal, today's operating status, live wait time overview, quick entry points to join or check status, and language switch.
2. **Join Queue Screen (`/join`):** Streamlined customer intake form. Name, mobile number verification, interactive selection of **up to 3 services**, barber preference choice, and wait time preview.
3. **My Status Screen (`/status/:tokenId`):** Personalized digital pass. Real-time queue position indicator, live countdown timer, assigned barber profile, audio call chime, and self-service cancellation.
4. **Reception Dashboard (`/reception`):** High-density control desk. Full queue timeline, fast walk-in registrant modal, chair assignment matrix, 10-minute no-show trigger, and manual re-ordering.
5. **Barber View (`/barber/:id`):** Touch-optimized chairside station. Current client card with requested services checklist, "Call Next", "Start Service", "Complete Service", and "Mark No-Show" actions.
6. **Waiting Area TV (`/tv`):** Fullscreen 16:9 visual board. High-contrast "Now Serving" vs. "Up Next" boards, chime announcement player, bilingual ticker, and QR code for mobile joining.
7. **Owner Settings (`/owner`):** Administrative control panel. Operating hours, 30-minute online cutoff enforcer, service catalog management, barber shift allocation, and throughput analytics.

---

## 7. System Invariants & Non-Negotiable Business Rules

All modules must strictly enforce these foundational rules:

1. **First-Come, First-Served (FCFS):** Base queue priority is determined strictly by token issuance timestamp, arbitrated cleanly when specific barber preferences are requested.
2. **Barber Preferences:** Clients may choose "Any Available" (fastest track) or pin their token to a specific barber.
3. **Three-Service Maximum:** A single queue token is capped at **exactly 3 services** to prevent schedule disruptions.
4. **One Active Position Per Phone Number:** A phone number cannot hold more than one active token (Waiting, Up Next, or In Service) simultaneously.
5. **Single-Occupancy Barber Chairs:** Exactly one client per barber at any given moment; a barber cannot serve multiple tokens concurrently.
6. **10-Minute No-Show Policy:** When a customer is called and does not report to the chair within 10 minutes, their token is revoked.
7. **New Token on Rejoining:** Forfeited, cancelled, or no-show tokens cannot be reinstated; customers must obtain a completely new token at the end of the queue.
8. **30-Minute Closing Cutoff:** Online joining is automatically disabled 30 minutes before salon closing time.
9. **Walk-in Reception Override:** Physical walk-ins can still be added by the receptionist past the online cutoff if salon capacity allows.
10. **Sub-5-Second Synchronization:** All state mutations propagate to every active screen within 5 seconds or less.

---

## 8. Success Metrics & Key Performance Indicators (KPIs)

- **Lobby Congestion Reduction:** ≥ 60% reduction in physical lobby crowding during peak weekend hours.
- **Wait Time Transparency Accuracy:** Estimated wait time accuracy within ±7 minutes of actual chair seat time.
- **No-Show Rate:** Drop in unnotified abandonments by ≥ 50% via transparent live status tracking.
- **Synchronization Latency:** 100% of queue events delivered to connected TV and tablet clients within `< 5000ms`.
- **Bilingual Adoption:** High usability compliance across Gujarati-first customers without receptionist intervention.
