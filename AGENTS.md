# AGENTS.md — Salon Queue Management System Guidelines for AI Coding Agents
**Document ID:** `AGENTS-CORE`  
**Version:** 1.0.0  
**Design Palette:** Charcoal (`#1F2937`), Dark Slate (`#111827`), Metallic Gold (`#D4A017`)  
**Localization:** English (`en`) & Gujarati (`gu`)

---

## 1. Project Context & Vibe Coding Philosophy

Welcome, Coding Agent. You are operating on the **Salon Queue Management System**, an ultra-responsive, bilingual queue coordination engine for premier salons and barber lounges.

When building or updating code in this repository, you must embrace the **Vibe Coding Philosophy**:
1. **Effortless Elegance:** Interfaces must feel luxurious, calm, and polished. Charcoal (`#1F2937`) canvas, deep onyx surfaces (`#111827`), and radiant metallic gold (`#D4A017`) accents. No visual clutter.
2. **Ironclad Reliability:** The queue engine coordinates real customers and busy barbers. Concurrency bugs, double bookings, or lost tokens ruin the salon vibe. System invariants are non-negotiable and strictly enforced.
3. **Frictionless Vernacular:** Every customer-facing component must support both **English** and **Gujarati (ગુજરાતી)** naturally with seamless instant language switching.
4. **Sub-5-Second Reflexes:** All screen updates (TV, Reception, Barber, Customer Mobile) must synchronize in **≤ 5 seconds**.

> [!IMPORTANT]
> **Strict Phase Boundary:** Do NOT write application source code (e.g. Next.js, React, Node, Python, HTML/JS) until the user explicitly instructs you to begin the implementation phase. Your current role is documentation, architecture, schema definitions, and contract verification.

---

## 2. The Seven Core Screens Architecture

Your implementation will deliver exactly seven distinct screens:

```
+-------------------------------------------------------------------------------+
| THE SEVEN SCREEN SYSTEM ARCHITECTURE                                          |
+----+----------------------+-------------------+-------------------------------+
| #  | SCREEN NAME          | ROUTE             | PRIMARY AUDIENCE              |
+----+----------------------+-------------------+-------------------------------+
| 01 | Home                 | /                 | Salon visitors & patrons      |
| 02 | Join Queue           | /join             | Self-service online & kiosk   |
| 03 | My Status            | /status/:tokenId  | Active customer digital pass  |
| 04 | Reception Dashboard  | /reception        | Front-desk coordinator        |
| 05 | Barber View          | /barber/:barberId | Chairside stylist tablet      |
| 06 | Waiting Area TV      | /tv               | 16:9 lobby signage & chime    |
| 07 | Owner Settings       | /owner            | Salon manager / administrator |
+----+----------------------+-------------------+-------------------------------+
```

For screen wireframes, layouts, typography, and button hierarchies, consult [02-screens.md](file:///c:/Users/Mahendra/OneDrive/Documents/pavan_kewlani/DAU/Sem1/Programming/Lab11/Salon-Queue-Management/docs/02-screens.md).

---

## 3. The 10 Invariant Commandments for Agents

When implementing backend services, data validators, or state reducers, you must enforce the following invariants unconditionally:

1. **First-Come, First-Served (FCFS):** Prioritize tokens by creation timestamp (`createdAt` ascending).
2. **Barber Preference Arbitration:** If a token specifies a preferred barber, it only matches that barber's chair. "Any Available" matches the earliest idle barber chair.
3. **Three-Service Maximum:** A queue booking can never contain more than 3 services. Validate both on the frontend UI and the API layer (`HTTP 422`).
4. **One Active Position Per Phone Number:** Query active queue states before issuing a token. If phone has an active token (`WAITING`, `UP_NEXT`, `CALLED`, `IN_SERVICE`), reject registration.
5. **One Customer Per Barber (Mutex):** A barber station can only have one customer in `IN_SERVICE` at any time.
6. **10-Minute No-Show Rule:** A timer of exactly 600 seconds begins upon calling a customer. If not seated within this window, transition state to `NO_SHOW` and release the barber.
7. **New Token on Rejoining:** Terminal tokens (`COMPLETED`, `CANCELLED`, `NO_SHOW`) can never be un-cancelled or revived. Rejoining creates a brand-new token at the queue tail.
8. **Online Joining Closure 30 Minutes Before Closing:** If $\text{now} \ge \text{closingTime} - 30\text{m}$, online `/join` is closed.
9. **Walk-Ins Allowed via Reception:** Receptionist can register in-person walk-ins even after the 30-minute online cutoff.
10. **Real-Time Synchronization Under 5 Seconds:** WebSocket, SSE, or short-interval fallback polling ($\le 4\text{s}$) must ensure end-to-end event propagation in under 5.0 seconds.

For complete flowcharts, state diagrams, and validation logic, consult [03-flows-rules.md](file:///c:/Users/Mahendra/OneDrive/Documents/pavan_kewlani/DAU/Sem1/Programming/Lab11/Salon-Queue-Management/docs/03-flows-rules.md).

---

## 4. Domain Data Model & Types

When authoring backend or client schemas (TypeScript/Zod/Pydantic), adhere to this domain model:

```typescript
// Token Status Lifecycle
export type TokenStatus = 
  | 'WAITING'      // In queue line
  | 'UP_NEXT'      // 1 or 2 slots away from chair
  | 'CALLED'       // Barber ready; 10-minute grace timer active
  | 'IN_SERVICE'   // Currently receiving service in chair
  | 'COMPLETED'    // Finished (Terminal)
  | 'NO_SHOW'      // Expired after 10-minute grace (Terminal)
  | 'CANCELLED';   // Customer cancelled (Terminal)

export type BarberPreference = 'ANY' | string; // 'ANY' or specific Barber ID

export interface ServiceItem {
  id: string;
  nameEn: string;
  nameGu: string;
  durationMinutes: number; // e.g. 15, 30, 45
  priceInr: number;        // in INR (₹)
  isActive: boolean;
}

export interface QueueToken {
  id: string;              // e.g. "G-14"
  customerName: string;
  customerPhone: string;   // 10 digits
  services: ServiceItem[]; // Length must be: 1 <= services.length <= 3
  barberPreference: BarberPreference;
  assignedBarberId?: string;
  chairNumber?: number;
  status: TokenStatus;
  isWalkIn: boolean;       // true if created by receptionist
  createdAt: string;       // ISO 8601 UTC
  calledAt?: string;       // ISO 8601 UTC (triggers 10m timer)
  serviceStartedAt?: string;
  serviceCompletedAt?: string;
  estimatedWaitMinutes: number;
}

export interface BarberStation {
  id: string;
  name: string;
  chairNumber: number;
  status: 'IDLE' | 'CALLING' | 'IN_SERVICE' | 'ON_BREAK' | 'OFFLINE';
  currentCustomerTokenId?: string;
  shiftStart: string;      // "09:00"
  shiftEnd: string;        // "21:00"
}

export interface SalonConfiguration {
  salonNameEn: string;
  salonNameGu: string;
  openingTime: string;     // "09:00"
  closingTime: string;     // "21:00"
  onlineCutoffMinutesBeforeClosing: number; // default: 30
  maxServicesPerBooking: number;           // default: 3
  noShowGracePeriodSeconds: number;        // default: 600 (10 mins)
  strictOneTokenPerPhone: boolean;         // default: true
  isEmergencyPaused: boolean;
}
```

---

## 5. Bilingual Localization (i18n) Engine

Every string displayed on any screen must be sourced from the central bilingual dictionary. No hardcoded English strings in UI templates.

### Example Translation Schema (`locales/translations.json`):
```json
{
  "en": {
    "brand_name": "Royal Touch Grooming",
    "brand_tagline": "Premium Men's Salon & Lounge",
    "btn_join_queue": "Join the Queue",
    "btn_track_token": "Track My Token",
    "token_number": "Token Number",
    "status_waiting": "Waiting in Line",
    "status_up_next": "Up Next — Please Arrive",
    "status_called": "Called to Chair",
    "status_in_service": "Now in Service",
    "status_no_show": "No-Show (Forfeited)",
    "status_completed": "Service Completed",
    "err_max_services": "Maximum 3 services permitted per session.",
    "err_duplicate_phone": "This phone number already has an active queue position.",
    "err_online_closed": "Online queue is closed 30 mins before closing. Walk-ins available at reception.",
    "no_show_timer_notice": "Please report to Chair within {minutes} minutes to retain your position."
  },
  "gu": {
    "brand_name": "રોયલ ટચ ગ્રૂમિંગ",
    "brand_tagline": "પ્રીમિયમ સલૂન અને ગ્રૂમિંગ લાઉન્જ",
    "btn_join_queue": "કતારમાં જોડાઓ",
    "btn_track_token": "મારું સ્ટેટસ જુઓ",
    "token_number": "ટોકન નંબર",
    "status_waiting": "રાહ જોઈ રહ્યા છે",
    "status_up_next": "આગળનો વારો — કૃપા કરીને પહોંચો",
    "status_called": "ખુરશી પર બોલાવ્યા છે",
    "status_in_service": "હાલમાં સેવા શરૂ છે",
    "status_no_show": "ગેરહાજર (રદ થયેલ)",
    "status_completed": "સેવા પૂર્ણ થઈ",
    "err_max_services": "પ્રતિ સત્ર મહત્તમ 3 સેવાઓની મંજૂરી છે.",
    "err_duplicate_phone": "આ ફોન નંબર પર પહેલેથી જ કતારમાં એક્ટિવ ટોકન છે.",
    "err_online_closed": "સલૂન બંધ થવાના 30 મિનિટ પહેલાં ઓનલાઇન કતાર બંધ છે. રૂબરૂ પધારો.",
    "no_show_timer_notice": "તમારો વારો જાળવી રાખવા માટે કૃપા કરીને {minutes} મિનિટમાં ખુરશી પર પહોંચો."
  }
}
```

---

## 6. Real-Time Synchronization Protocol Specification

To fulfill **Invariant 10** ($\Delta T \le 5000\text{ms}$):
1. **Transport Layer:** Implement Server-Sent Events (SSE) endpoint (`/api/events/queue`) or WebSocket stream.
2. **Payload Events:**
   - `QUEUE_UPDATED`: Broadcasts revised queue order, active count, and estimated wait times.
   - `TOKEN_CALLED`: Broadcasts token ID, target chair, and barber name (triggers Waiting Area TV audio chime).
   - `TIMER_TICK`: Propagates remaining seconds of any active 10-minute grace period.
   - `SALON_STATUS_CHANGED`: Notifies clients of opening, closing, or emergency pause.
3. **Resilience & Fallback:**
   - If SSE or WebSocket connection drops, client automatically switches to short polling every **3.5 seconds**.
   - Upon reconnecting, client requests a complete snapshot via `GET /api/queue/snapshot` to synchronize state.

---

## 7. Quality Assurance Checklist for Future Implementations

When writing tests for new code, verify all 10 test cases from [03-flows-rules.md](file:///c:/Users/Mahendra/OneDrive/Documents/pavan_kewlani/DAU\Sem1\Programming\Lab11\Salon-Queue-Management\docs\03-flows-rules.md):

- [ ] **TC-01:** 3-Service maximum capped strictly.
- [ ] **TC-02:** Duplicate active phone registration blocked.
- [ ] **TC-03:** FCFS chronological ordering respected.
- [ ] **TC-04:** Barber preference isolation doesn't stall unassigned queue.
- [ ] **TC-05:** 10-minute no-show countdown terminates and marks `NO_SHOW`.
- [ ] **TC-06:** Rejoining creates brand-new token; old token remains terminal.
- [ ] **TC-07:** Online queue closes 30 minutes before closing time.
- [ ] **TC-08:** Receptionist can still register walk-ins post-cutoff.
- [ ] **TC-09:** Single customer per barber chair mutex lock.
- [ ] **TC-10:** Latency between mutation and display update is $\le 5$ seconds.
- [ ] **TC-11:** Language switch preserves form state seamlessly.

---

## 8. Development Roadmap

1. **Phase 1 (Complete):** Core Specifications & System Design (`docs/01-brief.md`, `docs/02-screens.md`, `docs/03-flows-rules.md`, `AGENTS.md`).
2. **Phase 2 (Pending User Instruction):** Data stores, in-memory state engine, invariant validation guards, and unit tests.
3. **Phase 3 (Pending User Instruction):** Seven responsive UI screens, bilingual components, sound effects, and real-time synchronizer.
4. **Phase 4 (Pending User Instruction):** End-to-end integration and latency stress testing.
