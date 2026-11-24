# Salon Queue Management System

**Live demo:** https://salon-queue-management-theta.vercel.app/

**GitHub Repository:** https://github.com/pavankewlani/salon-queue-management

**Hosted on:** Vercel + Supabase

## About
A real-time Salon Queue Management System that allows customers to join queues, select services and barbers, track their position, and receive turn notifications.

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
1. **Home** (`/`) — Salon intro, operational status, and customer entry points
2. **Join Queue** (`/join`) — Customer self-service intake with service & barber selection
3. **My Status** (`/status/:id`) — Digital pass with live queue position & wait estimates
4. **Reception Dashboard** (`/reception`) — Front-desk queue coordination & walk-in registration
5. **Barber View** (`/barber/:name`) — Chairside stylist controls, active timer & client service completion
6. **Waiting Area TV** (`/display` / `/tv`) — Full-screen 16:9 lobby board with audio chime
7. **Owner Settings** (`/admin` / `/owner`) — Service catalog pricing, staff shifts, queue rules & analytics

## How to Run Locally

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

## Testing
Run the comprehensive automated test suite (75 tests):

```bash
npm run test
```

See [docs/03-flows-rules.md](docs/03-flows-rules.md) for the full test checklist and invariant definitions.
