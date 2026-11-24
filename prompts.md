# Salon Queue Management System — Development Prompts Log

This document contains the complete, chronological record of all prompts provided during the development, testing, refinement, database configuration, and production deployment of the **Salon Queue Management System**, as requested for academic verification.

---

## 1. Documentation Creation Prompt
**Date & Time:** `2026-11-22 21:58:12 IST` (`2026-11-22T16:28:12Z`)  
**Objective:** Author complete specification documentation and system invariants before writing application source code.

```text
Create the complete initial documentation for my Salon Queue Management System. Create docs/01-brief.md, docs/02-screens.md, docs/03-flows-rules.md and AGENTS.md. Follow the Salon Queue Management Vibe Coding Guide. Include seven screens: Home, Join Queue, My Status, Reception Dashboard, Barber View, Waiting Area TV and Owner Settings. Use charcoal #1F2937, gold #D4A017 and English/Gujarati support. Include all screen layouts, buttons, flows, rules, validation and tests. Enforce first come first served, barber preferences, three-service maximum, one active position per phone, one customer per barber, 10-minute no-show, new token on rejoining, online joining closure 30 minutes before closing, walk-ins allowed and real-time synchronization within five seconds. Include at least 10 test cases. Do not write application code yet. Show all four files.
```

---

## 2. Project Setup Prompt (Architecture Scaffold)
**Date & Time:** `2026-11-22 22:15:45 IST` (`2026-11-22T16:45:45Z`)  
**Objective:** Initialize React + Vite + TypeScript + Tailwind CSS structure, routing for all 7 screens, and bilingual context.

```text
Implement Step 1 only.

Set up React + Vite + TypeScript + Tailwind CSS
for the Salon Queue Management System.

Configure the Supabase client and modular folder structure.

Create empty routes for all seven screens:

/ 
/join
/status/:id
/reception
/barber/:name
/display
/admin

Implement React Router and English/Gujarati
language switching.

Use the design system specified in AGENTS.md.

Create reusable components and a clean architecture.

Do not implement actual queue functionality yet.

Run the project locally and verify it works.

List changed files and test commands.
```

---

## 3. Screen 1 (Home) & Screen 2 (Join Queue) Prompt
**Date & Time:** `2026-11-22 22:25:23 IST` (`2026-11-22T16:55:23Z`)  
**Objective:** Implement customer landing page, operational status, intake form, and service/barber selection.

```text
Build only Screen 1 (Home) and Screen 2 (Join Queue)
from docs/02-screens.md.

Home page:
- Salon name and logo.
- Open/closed status.
- Current waiting count.
- Estimated waiting time.
- Barber availability cards.
- Join Queue button.

Join Queue:
- Customer name.
- Validated 10-digit Indian phone number.
- Service selection, maximum 3 services.
- Service prices and duration.
- Barber selection or Any Barber.
- Live total price and estimated service duration.
- Expected waiting time.
- Confirm button.

Use realistic sample salon services and barbers.

Implement responsive mobile-first UI.

Use charcoal and gold theme.
Ensure English and Gujarati translations.

Test all interactions.
Do not modify unrelated screens.
```

---

## 4. Screen 3 (My Status) Prompt
**Date & Time:** `2026-11-22 22:40:05 IST` (`2026-11-22T17:10:05Z`)  
**Objective:** Customer digital pass, live queue tracking, wait estimation, travel advisory, and spot cancellation.

```text
Build Screen 3 (My Status) using docs/02-screens.md
and docs/03-flows-rules.md.

When a customer confirms their queue entry:

- Generate a unique sequential token such as S-1, S-2.
- Save the queue entry in Supabase.
- Display the customer's token.
- Show their current position.
- Calculate estimated waiting time.
- Update the position automatically.
- Show "Start coming" when the customer is second in line.
- Show "It's your turn!" when called.
- Add Cancel My Spot with confirmation.

Prevent duplicate active queue entries
for the same phone number.

Implement cancellation restrictions.

Test token generation, refresh persistence
and duplicate phone numbers.
```

---

## 5. Screen 4 (Reception Dashboard) Prompt
**Date & Time:** `2026-11-22 22:47:08 IST` (`2026-11-22T17:17:08Z`)  
**Objective:** Tablet landscape coordinator console, FCFS caller algorithm with barber arbitration, and walk-in intake.

```text
Build Screen 4 (Reception Dashboard).

Design it for a tablet in landscape mode.

Include:
- Barber cards with current customer.
- Barber availability and break status.
- Waiting customer list.
- Customer token, name, services and preferred barber.
- Waiting duration.
- Call Next button for each barber.
- Add Walk-in form.
- No-show and Cancel actions.

Implement first-come-first-served queue selection.

Call Next must:
- Select the earliest eligible customer.
- Skip customers assigned to another barber.
- Allow Any Barber customers.
- Never assign a customer to a barber who is busy or on break.

Implement backend/database validation.

Ensure all actions synchronize with customer status
within approximately five seconds.

Test multiple barbers and simultaneous customers.
```

---

## 6. Screen 5 (Barber View) & Screen 6 (Waiting Area TV) Prompt
**Date & Time:** `2026-11-22 22:56:37 IST` (`2026-11-22T17:26:37Z`)  
*(Re-issued at `2026-11-23 12:26:38 IST` after session resumption)*  
**Objective:** Stylist station tablet controls, chair service timers, full-screen 16:9 lobby signage, and audio chime.

```text
Build Screen 5 (Barber View) and Screen 6
(Waiting Area TV).

Barber View:
- Display barber name.
- Current customer's token and name.
- Selected services.
- Timer since service started.
- Start button.
- Done button.
- Next customer information.
- Available / On Break toggle.

Waiting Area TV:
- Full-screen dark charcoal design.
- Barber name and photo/avatar.
- Current customer token.
- Next five customer tokens.
- Estimated waiting times.
- Highlight newly called tokens in gold.
- Play a short chime when a customer is called.

All changes must synchronize with Reception
and My Status within approximately five seconds.

Enforce valid status transitions on the backend.

Test with multiple browser windows.
```

---

## 7. Screen 7 (Owner Settings) Prompt
**Date & Time:** `2026-11-24 17:58:38 IST` (`2026-11-24T12:28:38Z`)  
**Objective:** Admin configuration console for services, pricing, staff on-duty/break, closing hours, and analytics.

```text
Build Screen 7 (Owner Settings) using
docs/02-screens.md.

Implement:

1. Manage salon services.
2. Add, edit and disable services.
3. Configure service duration and price.
4. Manage barbers.
5. Set barbers on duty.
6. Set barbers on break.
7. Open or close online queue joining.
8. Configure salon opening and closing time.
9. Display today's customers served.
10. Display average waiting time.
11. Display no-show count.

Changes must persist in Supabase.

When a service is disabled, it should disappear
from Join Queue automatically.

When online joining is closed, customers
must see an appropriate message.

Walk-ins must remain allowed.

Do not modify other working screens.
```

---

## 8. QA Engineering & Verification Prompt (Audit 1)
**Date & Time:** `2026-11-24 18:04:12 IST` (`2026-11-24T12:34:12Z`)  
**Objective:** Senior QA audit across all 17 functional scenarios, negative tests, and concurrency edge cases.

```text
Act as a senior QA engineer.

Read docs/03-flows-rules.md and audit the entire
Salon Queue Management System.

Test the actual application, not just its source code.

Test these scenarios:

1. Customer joins with two services.
2. Correct price and duration are calculated.
3. Customer receives a unique token.
4. Same phone number cannot join twice.
5. Customer can track queue position.
6. Reception calls the next eligible customer.
7. Barber preference is respected.
8. Customer receives the turn notification.
9. Barber starts and completes the service.
10. TV display updates automatically.
11. No-show customers can be re-added at the end.
12. Barber on break is excluded from assignment.
13. Online joining closes at the correct time.
14. Walk-ins remain possible.
15. Gujarati translation works across all screens.
16. Data persists after refresh and backend/database restart.
17. Multiple browser windows remain synchronized.

Also test:
- Invalid phone numbers.
- Empty service selection.
- More than three services.
- Duplicate submissions.
- Invalid queue transitions.
- Two simultaneous requests for the same barber.
- Two customers attempting to join with the same phone number.

Fix every reproducible bug.

Run automated tests and production build checks.

Report each test as PASS or FAIL with evidence.

List known limitations and remaining bugs.

Do not claim anything passed unless it was
actually tested.
```

---

## 9. Security, Authentication & Role-Based Access Control Prompts
**Date & Time:** `2026-11-24 18:16:32 IST` & `18:17:08 IST`  
**Objective:** Add user authentication, hide admin console from unauthorized guests, and protect customer phone privacy.

```text
can i get a login and sign up section so that the admin gets his panel hidden and others user can't see the whole queue without signinning in and yes other users can't see each other information
```

### Refinement & Polish Prompts:
**Date & Time:** `2026-11-24 18:46:12 IST`  
```text
keep a back button in lobby tv
```

**Date & Time:** `2026-11-24 18:51:28 IST`  
```text
Step 1 Architecture Scaffold — UI & Routing Loaded. Queue mechanics activate in Step 2. remove this and yes also remove without type logins for everyone
```

**Date & Time:** `2026-11-24 18:53:28 IST`  
```text
Demo passwords: admin123 (Owner) • staff123 (Reception) remove this also
```

---

## 10. Database Integration & Setup Prompts (Supabase)
**Date & Time:** `2026-11-24 18:31:32 IST` (`2026-11-24T13:01:32Z`)  
**Objective:** Instructions and schema creation for connecting to live cloud Supabase.

```text
how to connect it with supabase
```

*(User followed by uploading screenshots of Supabase API Keys and SQL Editor execution showing `Success. No rows returned`).*

### Database Connectivity Verification:
**Date & Time:** `2026-11-24 18:50:04 IST` (`2026-11-24T13:20:04Z`)  
```text
how to check wheather it is connected to database or not
```

### Database Troubleshooting & Permission Resolution:
**Date & Time:** `2026-11-24 18:58:23 IST` (`2026-11-24T13:28:23Z`)  
```text
DB Setup Required
```
*(Resolved PostgreSQL error `42501 permission denied for table salon_services` by providing the `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;` script).*

---

## 11. Final QA Audit Prompt (Audit 2)
**Date & Time:** `2026-11-24 19:05:31 IST` (`2026-11-24T13:35:31Z`)  
**Objective:** Comprehensive post-authentication and post-database regression testing across all 24 scenarios.

```text
Act as a senior QA engineer.

Read docs/03-flows-rules.md and audit the entire
Salon Queue Management System.

Test the actual application, not just its source code.

Test these scenarios:

1. Customer joins with two services.
2. Correct price and duration are calculated.
3. Customer receives a unique token.
4. Same phone number cannot join twice.
5. Customer can track queue position.
6. Reception calls the next eligible customer.
7. Barber preference is respected.
8. Customer receives the turn notification.
9. Barber starts and completes the service.
10. TV display updates automatically.
11. No-show customers can be re-added at the end.
12. Barber on break is excluded from assignment.
13. Online joining closes at the correct time.
14. Walk-ins remain possible.
15. Gujarati translation works across all screens.
16. Data persists after refresh and backend/database restart.
17. Multiple browser windows remain synchronized.

Also test:
- Invalid phone numbers.
- Empty service selection.
- More than three services.
- Duplicate submissions.
- Invalid queue transitions.
- Two simultaneous requests for the same barber.
- Two customers attempting to join with the same phone number.

Fix every reproducible bug.

Run automated tests and production build checks.

Report each test as PASS or FAIL with evidence.

List known limitations and remaining bugs.

Do not claim anything passed unless it was
actually tested.
```

---

## 12. Deployment Preparation Prompt
**Date & Time:** `2026-11-24 19:09:09 IST` (`2026-11-24T13:39:09Z`)  
**Objective:** Production build readiness, Vercel SPA routing (`vercel.json`), `.env.example`, and `.gitignore` credential masking.

```text
Prepare my Salon Queue Management System
for production deployment.

The frontend will be hosted on Vercel
and the database/backend services on Supabase.

Check:

1. Production build works.
2. Environment variables are configured correctly.
3. No localhost URLs remain in production code.
4. Supabase configuration is correct.
5. Row Level Security is enabled.
6. Secret keys are not exposed in frontend code.
7. All seven routes work after refreshing.
8. Realtime subscriptions work in production.
9. Mobile layouts work correctly.
10. Error handling and loading states are implemented.

Create a complete .env.example file
without actual credentials.

Do not deploy yet.

Show me the exact environment variables,
build command and deployment settings required.
```

---

## 13. Git Commit & Push Prompt
**Date & Time:** `2026-11-24 19:12:03 IST` (`2026-11-24T13:42:03Z`)  
**Objective:** Stage all project files safely without `.env`, commit with standardized message, and push to personal GitHub repository.

```text
Check Git status.

Commit the completed and tested application
with the message:

Completed Salon Queue Management MVP.

Push all required project files to my personal
public GitHub repository.

Do not commit .env files, passwords,
secret keys or database credentials.

Show the GitHub repository URL.
```

---

## 14. Live Documentation & README Prompt
**Date & Time:** `2026-11-24 19:36:13 IST` (`2026-11-24T14:06:13Z`)  
**Objective:** Populate root `README.md` with live Vercel deployment and GitHub repository links.

```text
# Salon Queue Management System

**Live demo:** https://YOUR-ACTUAL-VERCEL-URL.vercel.app

**GitHub Repository:** https://github.com/YOUR-USERNAME/salon-queue-management

**Hosted on:** Vercel + Supabase

## About
A real-time Salon Queue Management System that allows
customers to join queues, select services and barbers,
track their position and receive turn notifications.

## Features
- Customer queue registration
- Live queue tracking
- Reception dashboard
- Barber management
- Waiting area TV display
- Owner settings
- English and Gujarati language support

## Technologies Used
- React
- Vite
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL

## Screens
1. Home
2. Join Queue
3. My Status
4. Reception Dashboard
5. Barber View
6. Waiting Area TV
7. Owner Settings

## How to Run Locally
npm install
npm run dev

## Testing
See docs/03-flows-rules.md for the test checklist.
https://salon-queue-management-theta.vercel.app/     https://github.com/pavankewlani/salon-queue-management.git
```
