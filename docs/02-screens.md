# Salon Queue Management System — UI & Screen Specifications
**Document ID:** `DOC-02-SCREENS`  
**Version:** 1.0.0  
**Design Palette:** Charcoal (`#1F2937`), Dark Slate (`#111827`), Metallic Gold (`#D4A017`), Amber (`#F59E0B`), Emerald (`#10B981`), Crimson (`#EF4444`)  
**Bilingual Support:** Full English (en) & Gujarati (ગુજરાતી - gu)

---

## 1. Global UI Shell & Styling Standards

### 1.1 Color Tokens & Component Themes
- **Canvas / Background:** `#1F2937` (Primary Charcoal Slate)
- **Surfaces & Cards:** `#111827` (Deep Onyx Slate with `#374151` borders)
- **Primary Accent / Brand:** `#D4A017` (Metallic Gold)
- **Primary CTA Buttons:** Background `#D4A017`, Text `#111827` (Bold, rounded-lg, gold shadow hover)
- **Secondary Buttons:** Background transparent, Border 1px `#D4A017`, Text `#D4A017`
- **Text Headings:** `#F9FAFB` (Crisp White)
- **Text Body / Muted:** `#9CA3AF` (Muted Silver Gray)
- **Status Badges:**
  - `Waiting` (`રાહ જોઈ રહ્યા છે`): Slate `#374151` background, Text `#9CA3AF`
  - `Up Next` (`આગળનો વારો`): Amber `#78350F` background, Text `#F59E0B`
  - `In Service / Serving` (`સેવા શરૂ છે`): Emerald `#064E3B` background, Text `#10B981`
  - `No-Show / Cancelled` (`ગેરહાજર / રદ`): Crimson `#7F1D1D` background, Text `#EF4444`

### 1.2 Global Header Elements
Every screen (except Waiting Area TV in kiosk mode) features:
1. **Brand Logo / Name:** "Royal Touch Grooming" / "રોયલ ટચ ગ્રૂમિંગ" in Gold lettering.
2. **Salon Live Status Badge:** "Open" (`ખુલ્લું છે` - green pill) or "Queue Closed" (`ઓનલાઇન કતાર બંધ છે` - amber pill).
3. **Language Switcher Toggle:** Segmented pill toggle: `[ EN | ગુજરાતી ]`. Switching immediately triggers dynamic i18n label transformation without clearing entered form state.
4. **Real-time Sync Pulse Indicator:** Small dot in top right: Glowing Green pulse (`Synced < 5s`) or Amber (`Reconnecting...`).

---

## 2. Screen 1: Home Screen (`/`)

### 2.1 Purpose & Role
The digital storefront for salon patrons. Provides instant visibility into current queue depth, estimated wait times, salon operational hours, and immediate one-tap routing to either join the line or track an existing active ticket.

### 2.2 Screen Wireframe
```
+--------------------------------------------------------------------------+
|  ROYAL TOUCH GROOMING                   [ OPEN ]     [ EN | ગુજરાતી ]     |
+--------------------------------------------------------------------------+
|                                                                          |
|                           ROYAL TOUCH GROOMING                           |
|                    પ્રીમિયમ સલૂન અને ગ્રૂમિંગ લાઉન્જ                     |
|                                                                          |
|    +------------------------+  +------------------------+                |
|    | CURRENT QUEUE LENGTH   |  | ESTIMATED WAIT TIME    |                |
|    |      6 Persons         |  |      ~25 Mins          |                |
|    +------------------------+  +------------------------+                |
|                                                                          |
|         [  + JOIN THE QUEUE / કતારમાં જોડાઓ (CTA Gold)  ]                |
|                                                                          |
|         [  TRACK MY TOKEN / મારું સ્ટેટસ જુઓ (Secondary) ]               |
|                                                                          |
|  ----------------------------------------------------------------------  |
|  TODAY'S ACTIVE STYLISTS / આજના હેર સ્ટાઈલિશ                              |
|  [ Amit (Haircut, Beard) - Active ]  [ Vikram (All Services) - Active ]  |
|                                                                          |
|  HOURS: 09:00 AM - 09:00 PM | ONLINE QUEUE CLOSES AT 08:30 PM            |
+--------------------------------------------------------------------------+
```

### 2.3 Interactive Components & States
- **Hero Title & Subtitle:** English: "Royal Touch Grooming — Premium Men's Lounge" | Gujarati: "રોયલ ટચ ગ્રૂમિંગ — પ્રીમિયમ સલૂન અને ગ્રૂમિંગ લાઉન્જ".
- **Live Stats Cards:**
  - *Active Waiting Count:* Real-time tally of customers currently in queue.
  - *Estimated Wait Time:* Dynamic estimation for new entrants joining now.
- **Primary CTA Button:** `[ + Join the Queue / કતારમાં જોડાઓ ]` — Large gold pill button. If online queue is closed (30 min before closing or owner override), disabled with label: "Online Queue Closed for Today / આજ માટે ઓનલાઇન કતાર બંધ છે".
- **Secondary CTA Button:** `[ Track My Token / મારું સ્ટેટસ જુઓ ]` — Opens a quick modal to input a 10-digit phone number or token ID to jump to their existing status.
- **Barber Attendance Strip:** Displays active barbers with status pills (`Available`, `In Service`, `On Break`).
- **Footer Metadata:** Salon address, operating hours, and explicit disclaimer: "Online queue closes 30 minutes before closing time. Walk-ins subject to salon capacity."

---

## 3. Screen 2: Join Queue Screen (`/join`)

### 3.1 Purpose & Role
The core self-service customer registration portal. Collects customer details, limits service selection to a strict maximum of 3 services, captures barber preference, verifies phone number uniqueness in the active queue, and validates against salon closing time rules.

### 3.2 Screen Wireframe
```
+--------------------------------------------------------------------------+
|  < BACK TO HOME                        [ EN | ગુજરાતી ]      SYNC: LIVE  |
+--------------------------------------------------------------------------+
|  JOIN THE QUEUE / કતારમાં જોડાઓ                                          |
|  Please fill in your details below / કૃપા કરીને તમારી વિગતો ભરો           |
|                                                                          |
|  1. Full Name / પૂરું નામ *                                               |
|  [ e.g., Rajesh Patel                                                  ] |
|                                                                          |
|  2. Mobile Number / મોબાઈલ નંબર * (10 Digits)                            |
|  [ +91 | 9876543210                                                    ] |
|  (Note: Exactly 1 active token allowed per phone number)                 |
|                                                                          |
|  3. Select Services / સેવાઓ પસંદ કરો (Max 3 Services Allowed) *          |
|  [x] Classic Haircut (30m - ₹250)    [x] Beard Trim & Shape (15m - ₹150) |
|  [ ] Charcoal Face Scrub (20m - ₹300)[ ] Hair Spa & Massage (35m - ₹500) |
|  Selected: 2 / 3 Max | Total Duration: 45 Mins | Total: ₹400             |
|                                                                          |
|  4. Barber Preference / હેર સ્ટાઈલિશ પસંદગી                               |
|  (o) Any Available Barber (Fastest) / કોઈપણ ઉપલબ્ધ (સૌથી ઝડપી)            |
|  ( ) Amit Kumar (Current wait: ~25 mins)                                 |
|  ( ) Vikram Dave (Current wait: ~40 mins)                                |
|                                                                          |
|  +--------------------------------------------------------------------+  |
|  | ESTIMATED SUMMARY:                                                 |  |
|  | Estimated Wait: ~25 mins | Est. Seat Time: 04:45 PM                |  |
|  +--------------------------------------------------------------------+  |
|                                                                          |
|  [   CONFIRM & JOIN QUEUE / કન્ફર્મ કરો અને કતારમાં જોડાઓ (Gold CTA)  ]   |
+--------------------------------------------------------------------------+
```

### 3.3 Components, Validations & Behavior
- **Customer Name Input:** Required string, 2-50 characters.
- **Mobile Number Input:** 
  - Standard 10-digit Indian phone format regex (`^[6-9]\d{9}$`).
  - Pre-validation lookup: If this phone number already possesses an active token (`Waiting`, `Up Next`, `In Service`), submission is blocked immediately with an error banner:
    *"This phone number already has an active queue token (#G-12). You cannot register twice simultaneously."* / *"આ ફોન નંબર પર પહેલેથી જ એક્ટિવ ટોકન (#G-12) ઉપલબ્ધ છે."*
- **Service Selection Chips (Strict 3-Service Ceiling):**
  - Grid of service cards displaying service name (EN & GU), duration (minutes), and price.
  - Checkbox multi-select with live counter badge (`X / 3 Selected`).
  - **Dynamic Constraint Guard:** When 3 services are checked, all remaining unchecked service cards are visually disabled with a tooltip: *"Maximum 3 services permitted per session"* / *"પ્રતિ સત્ર મહત્તમ 3 સેવાઓની મંજૂરી છે"*.
- **Barber Preference Selector:**
  - Radio options or card selector.
  - Option 1 (Default): "Any Available Barber / કોઈપણ ઉપલબ્ધ હેર સ્ટાઈલિશ (Fastest turnaround)".
  - Option 2..N: Specific barbers currently on shift, showing their specific queue backlog and estimated wait.
- **Real-Time 30-Minute Closing Cutoff Enforcer:**
  - If current time is within 30 minutes of salon closing (or beyond closing), form submission is locked:
    *"Online queue registration has closed for the day (30 mins before closing). Please visit the salon reception directly for walk-in availability."*
- **Submit Button:** `[ Confirm & Join Queue / કન્ફર્મ કરો અને કતારમાં જોડાઓ ]`
  - Shows spinner on submit. On success, transitions directly to **Screen 3: My Status** with the generated token.

---

## 4. Screen 3: My Status Screen (`/status/:tokenId`)

### 4.1 Purpose & Role
The customer's personalized, live-updating digital boarding pass. Enables customers to leave the salon premises and track their exact queue progress from anywhere in real time. Features countdown timers, barber details, sound alert toggles, and safe cancellation.

### 4.2 Screen Wireframe
```
+--------------------------------------------------------------------------+
|  ROYAL TOUCH GROOMING                   [ LIVE SYNC (o) ]  [ EN | ગુજરાતી ]|
+--------------------------------------------------------------------------+
|                                                                          |
|                         YOUR TOKEN NUMBER / તમારો ટોકન                    |
|                                                                          |
|                            #G-14                                         |
|                                                                          |
|             [ STATUS: UP NEXT / આગળનો વારો - PLEASE ARRIVE ]             |
|                                                                          |
|  +--------------------------------------------------------------------+  |
|  |  QUEUE POSITION: 2nd in Line       ESTIMATED WAIT: ~8 Mins         |  |
|  +--------------------------------------------------------------------+  |
|                                                                          |
|  ASSIGNED BARBER / હેર સ્ટાઈલિશ:                                          |
|  Amit Kumar (Chair 2) [Photo/Avatar]                                     |
|                                                                          |
|  SELECTED SERVICES (2/3):                                                |
|  - Classic Haircut (30m - ₹250)                                          |
|  - Beard Trim & Shape (15m - ₹150)                                       |
|  Total Booked Duration: 45 Mins | Total Price: ₹400                      |
|                                                                          |
|  [x] Sound Alert on Call (Ding-Dong Chime Enabled)                       |
|                                                                          |
|  [  CANCEL MY POSITION / કતારમાંથી નામ રદ કરો (Outline Red)  ]          |
|                                                                          |
|  * Note: Once cancelled or marked no-show, this token cannot be revived. |
|    Rejoining requires obtaining a brand-new token at the end of the line.|
+--------------------------------------------------------------------------+
```

### 4.3 Component States & Transitions
- **Token Display:** Giant, high-contrast gold badge (e.g., `#G-14`).
- **Dynamic Status Banner:**
  - `Waiting` (`રાહ જોઈ રહ્યા છે` - Charcoal/Silver): *"You are currently #4 in line. Please relax."*
  - `Up Next` (`આગળનો વારો` - Amber Banner with pulsing animation): *"You are next in line! Please report to Royal Touch reception immediately."*
  - `In Service` (`સેવા શરૂ છે` - Emerald Green Banner): *"You are currently being served in Chair 2 by Amit Kumar."*
  - `No-Show` (`ગેરહાજર` - Crimson Banner): *"Your token was cancelled due to no-show after the 10-minute grace period. Please join again for a new token."*
  - `Completed` (`પૂર્ણ થયેલ` - Slate Banner): *"Service finished. Thank you for visiting Royal Touch!"*
- **10-Minute No-Show Warning Countdown (When status is "Called"):**
  - If the barber or receptionist calls the customer and they are not seated, a prominent 10-minute countdown displays in amber/red:
    *"Please report to Chair 2 within 07:42 minutes to retain your spot."*
- **Audio Chime Trigger:** When status transitions from `Waiting` to `Up Next` or `Called`, client browser triggers a crisp luxury chime if audio toggle is enabled.
- **Cancel Button Modal:** Prompts confirmation: *"Are you sure you want to leave the queue? You will forfeit this position and must get a new token to rejoin."*

---

## 5. Screen 4: Reception Dashboard (`/reception`)

### 5.1 Purpose & Role
The desktop and tablet command console for the front-desk receptionist. Houses the entire active queue lifecycle, enables high-speed walk-in intake, displays barber chair occupancy, triggers customer calls, handles manual chair re-assignments, and initiates the 10-minute no-show countdown.

### 5.2 Screen Wireframe
```
+----------------------------------------------------------------------------------------------------+
| ROYAL TOUCH - RECEPTION DESK     [ SALON: OPEN ]  [ 04:15 PM ]  [ EN | ગુજરાતી ]     [ LOGOUT ]     |
+----------------------------------------------------------------------------------------------------+
| STATS: In Queue: 7 | In Service: 3 | Completed Today: 34 | No-Shows: 2 | Avg Wait: 18m             |
+------------------------------------------------------------------+---------------------------------+
| ACTIVE QUEUE MANAGEMENT (Real-Time Synchronized)                 | FAST WALK-IN INTAKE / સીધા ગ્રાહક|
| Filters: [ All (7) ] [ Waiting (4) ] [ Up Next (2) ] [ Called (1)|---------------------------------+
+------+-------+------------------+----------+----------+---------+| Customer Name:                  |
|TOKEN | CLIENT| SERVICES (Max 3) | PREFERENCE| WAIT EST | ACTION  || [ Ramesh Shah                 ] |
+------+-------+------------------+----------+----------+---------+| Phone Number:                   |
|#G-12 | Rajesh| Haircut (30m)    | Any (Amit| Seated   | [Finish]|| [ 9825012345                  ] |
|#G-13 | Bhavin| Cut+Beard (45m)  | Vikram   | Seated   | [Finish]|| Select Services (Max 3):        |
|#G-14 | Hardik| Haircut (30m)    | Amit     | Up Next  | [CALL]  || [x] Haircut  [x] Beard  [ ] Spa |
|#G-15 | Jayesh| Shave (20m)      | Any      | ~12 mins | [Assign]|| Barber Preference:              |
|#G-16 | Parth | Cut+Facial (50m) | Any      | ~25 mins | [Assign]|| [ Any Available Barber        v]|
+------+-------+------------------+----------+----------+---------+| [ + ADD WALK-IN TO QUEUE (Gold)]|
|                                                                  +---------------------------------+
| [!] ACTIVE CALL TIMER: Token #G-14 called at 04:12 PM            | BARBER CHAIR STATUS MATRIX      |
|     10-Min No-Show Countdown: 06:45 remaining                    |---------------------------------+
|     [ Seat Customer Now ]   [ Trigger No-Show Cancel ]           | Chair 1: Amit Kumar [BUSY #G-12]|
|                                                                  | Chair 2: Vikram Dave [BUSY #G-13|
| Manual Controls: [ Drag to Re-Order ]  [ Broadcast Announcement ]| Chair 3: Chetan Solanki [IDLE]  |
+------------------------------------------------------------------+---------------------------------+
```

### 5.3 Core Controls & Actions
1. **Fast Walk-in Registration Widget:**
   - Always accessible on the right pane.
   - Enforces the 1-phone = 1-token and max-3-services invariants.
   - **Walk-in Exception Rule:** Even if the 30-minute online cutoff has passed, the receptionist retains administrative authorization to register a walk-in if the salon chairs can accommodate them before closing.
2. **Chair Allocation Matrix:** Real-time visual status of every barber station (Occupied with Token ID, Idle, Break, Offline).
3. **Queue Row Actions:**
   - `[ Call Customer ]`: Triggers notification chime on TV and SMS/Push to customer. Sets token status to `Called` and initiates the 10-minute timer.
   - `[ Seat Customer / Start ]`: Moves token to `In Service` and ties customer to the specific barber chair. Mutex locks the barber so no other customer can be assigned.
   - `[ Mark No-Show ]`: If 10 minutes expire or customer confirms they cannot come, receptionist marks no-show. Token is permanently revoked.
   - `[ Reassign Barber ]`: Modal allowing customer to be routed to another available barber if original stylist is delayed.

---

## 6. Screen 5: Barber View (`/barber/:barberId`)

### 6.1 Purpose & Role
A clean, large-touch interface mounted on a tablet at each barber's chair or accessed via their mobile phone. Provides the barber with single-focus clarity: who is in their chair, what exact services are approved, an active chair stopwatch, and control to call their next patron.

### 6.2 Screen Wireframe
```
+--------------------------------------------------------------------------+
|  ROYAL TOUCH BARBER DESK | CHAIR 2: AMIT KUMAR        [ EN | ગુજરાતી ]   |
|  STATUS: [ (o) READY FOR CLIENT ]    [ GO ON 15-MIN BREAK ]  [ GO OFFLINE] |
+--------------------------------------------------------------------------+
|                                                                          |
|  CURRENT CLIENT IN CHAIR / હાલના ગ્રાહક                                   |
|                                                                          |
|  TOKEN: #G-12   |  CLIENT: Rajesh Patel  |  PHONE: +91 98*** **210        |
|                                                                          |
|  BOOKED SERVICES CHECKLIST (Max 3):                                      |
|  [x] Classic Haircut (Est: 30 mins)                                      |
|  [ ] Beard Sculpting & Razor Finish (Est: 15 mins)                       |
|                                                                          |
|  CHAIR STOPWATCH / સમય: 00:22:15  (Est Total: 45:00)                      |
|                                                                          |
|  +--------------------------------------------------------------------+  |
|  | [ START SERVICE ]     [ COMPLETE & CALL NEXT / પૂર્ણ અને આગળના ]    |  |
|  +--------------------------------------------------------------------+  |
|                                                                          |
|  [!] CLIENT NOT AT CHAIR?                                                |
|  [ CALL CUSTOMER (10-MIN GRACE) ]   [ MARK NO-SHOW / રદ કરો ]            |
|                                                                          |
|  ----------------------------------------------------------------------  |
|  UPCOMING IN YOUR QUEUE / તમારા પછીના ગ્રાહકો:                            |
|  1. #G-14 - Hardik (Haircut - 30m) - Preferred You                       |
|  2. #G-15 - Jayesh (Beard Trim - 15m) - Any Barber                       |
+--------------------------------------------------------------------------+
```

### 6.3 Interactions & Invariants
- **Single Occupancy Guard:** A barber cannot press "Start Service" on a new token while another token is still marked `In Service` at their chair.
- **Service Completion Flow:** Pressing `[ Complete & Call Next ]`:
  1. Sets current token to `Completed`.
  2. Frees chair state to `Idle`.
  3. Automatically fetches the next eligible token (prioritizing preferred clients first, then general FCFS).
  4. Triggers call announcement on TV and updates customer's **My Status** screen.
- **No-Show Enforcement:** If the next customer is called but does not appear, the barber taps `[ Mark No-Show ]`. If within the 10-minute window, the remaining time is shown; if 10 minutes have elapsed, the token is revoked and the subsequent patron is summoned.

---

## 7. Screen 6: Waiting Area TV (`/tv`)

### 7.1 Purpose & Role
A zero-interaction, high-definition 16:9 lobby signage screen viewed by waiting customers from across the room. Designed in pure Dark Charcoal `#1F2937` with radiant Metallic Gold `#D4A017` typography for maximum luxury and long-range legibility.

### 7.2 Screen Wireframe (16:9 Display Layout)
```
+----------------------------------------------------------------------------------------------------+
|  ROYAL TOUCH GROOMING LOUNGE                     16:45:12 PM               [ EN | ગુજરાતી ROTATING]|
+--------------------------------------------------+-------------------------------------------------+
|               NOW SERVING                        |                    UP NEXT                      |
|            હાલમાં સેવા શરૂ છે                     |                  આગળનો વારો                     |
+--------------------------------------------------+-------------------------------------------------+
|  CHAIR 1: AMIT KUMAR                             |  1. TOKEN #G-14                                 |
|  +--------------------------------------------+  |     Hardik P.  | Chair 1 (Amit)                 |
|  | TOKEN: #G-12                               |  |     Estimated Wait: ~3 mins                     |
|  | Client: Rajesh P.   | Service: Cut + Beard |  |                                                 |
|  +--------------------------------------------+  |  2. TOKEN #G-15                                 |
|                                                  |     Jayesh S.  | Any Available                  |
|  CHAIR 2: VIKRAM DAVE                            |     Estimated Wait: ~10 mins                    |
|  +--------------------------------------------+  |                                                 |
|  | TOKEN: #G-13                               |  |  3. TOKEN #G-16                                 |
|  | Client: Bhavin K.   | Service: Haircut     |  |     Parth M.   | Any Available                  |
|  +--------------------------------------------+  |     Estimated Wait: ~22 mins                    |
|                                                  |                                                 |
|  CHAIR 3: CHETAN SOLANKI                         |  4. TOKEN #G-17                                 |
|  +--------------------------------------------+  |     Nilesh T.  | Chair 2 (Vikram)               |
|  | [ CHAIR READY / આવો બેસો ]                 |  |     Estimated Wait: ~35 mins                    |
|  +--------------------------------------------+  |                                                 |
+--------------------------------------------------+-------------------------------------------------+
|  [ QR CODE ] SCAN WITH PHONE TO JOIN THE QUEUE   | TICKER: Welcome to Royal Touch. Free Wi-Fi: RT- |
|              તમારા ફોનથી કતારમાં જોડાવા સ્કેન કરો   | Guest. Online queue closes at 08:30 PM.         |
+----------------------------------------------------------------------------------------------------+
```

### 7.3 Visual & Functional Specifications
- **Legibility Standards:**
  - Token Numbers rendered in bold 72pt+ Metallic Gold (`#D4A017`).
  - Barber Station names in 32pt Crisp White (`#F9FAFB`).
- **Audio Chime System:** Whenever a token is moved to `Called` or `Now Serving`, the TV plays a gentle two-tone chime (`ding-dong`) followed by a synthesized bilingual voice announcement:
  *"Token G-14, please proceed to Chair 1."* / *"ટોકન જી-૧૪, કૃપા કરીને ખુરશી ૧ પર જાઓ."*
- **Language Cycling Ticker:** The bottom ticker smoothly cross-fades every 8 seconds between English and Gujarati announcements.
- **Dynamic QR Code:** Directs camera scans to the mobile `/join` page with automatic salon context pre-loaded.

---

## 8. Screen 7: Owner Settings & Analytics (`/owner`)

### 8.1 Purpose & Role
Administrative oversight screen for the salon proprietor. Manages business hours, service menus and pricing, barber profiles and shifts, queue rule parameters, and daily business performance analytics.

### 8.2 Screen Wireframe
```
+--------------------------------------------------------------------------+
| ROYAL TOUCH - OWNER CONTROL PANEL         [ 04:15 PM ]      [ EN | ગુજરાતી ]|
+--------------------------------------------------------------------------+
| TABS: [ 1. Operating Rules ] [ 2. Services ] [ 3. Barbers ] [ 4. Analytics]|
+--------------------------------------------------------------------------+
| 1. QUEUE POLICIES & OPERATING HOURS:                                     |
|    - Opening Time: [ 09:00 AM ]   Closing Time: [ 09:00 PM ]             |
|    - Online Queue Auto-Cutoff: [ 30 ] Minutes Before Closing (Default)   |
|    - Maximum Services per Booking: [ 3 ] Services (Hard Invariant)       |
|    - No-Show Grace Period Timer:   [ 10 ] Minutes                        |
|    - Duplicate Phone Number Rule:  [x] Strict 1 Active Token per Phone   |
|    - Emergency Force Queue Status: (o) Normal Open  ( ) Emergency Pause  |
|                                                                          |
| 2. SERVICE CATALOG MANAGEMENT:                                           |
|    + Add New Service                                                     |
|    1. Classic Haircut    | 30 Mins | ₹250 | [Edit] [Active: ON ]         |
|    2. Beard Trim & Shape | 15 Mins | ₹150 | [Edit] [Active: ON ]         |
|    3. Charcoal Facial    | 45 Mins | ₹600 | [Edit] [Active: ON ]         |
|                                                                          |
| 3. BARBER SHIFT & CHAIR ASSIGNMENTS:                                     |
|    + Add Barber                                                          |
|    1. Amit Kumar   | Chair 1 | Shift: 09:00 - 18:00 | [Status: Active]   |
|    2. Vikram Dave  | Chair 2 | Shift: 12:00 - 21:00 | [Status: Active]   |
|                                                                          |
| 4. TODAY'S REAL-TIME ANALYTICS SUMMARY:                                  |
|    Total Customers Served: 42 | Avg Wait Time: 16.4 mins                 |
|    No-Show Rate: 4.5% (2)     | Peak Hour: 02:00 PM - 04:00 PM           |
|    Total Queue Revenue Generated: ₹14,250                                |
+--------------------------------------------------------------------------+
```

### 8.3 Configuration Controls
- **Operating Hours & 30-Min Cutoff:** Allows adjustment of salon opening and closing times. The 30-minute online cutoff calculation dynamically recalculates based on the chosen closing time.
- **Service Catalog CRUD:** Edit titles, descriptions (English & Gujarati), durations (minutes), and prices (₹ INR).
- **Barber Staff Management:** Add stylists, assign them to physical chair numbers, mark them active or on leave.
- **Live Analytics Snapshot:** Real-time calculation of customer throughput, average wait times, barber idle times, and no-show counts.
