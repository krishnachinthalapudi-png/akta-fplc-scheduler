# ÄKTA FPLC Scheduler

Lab instrument reservation and scheduling system for the ÄKTA FPLC — Chinthalapudi Lab, Pelotonia Research Center, The Ohio State University.

## Features
- Weekly calendar view with color-coded reservations
- Click any open slot to instantly book
- Conflict detection (no double-booking)
- Reservation list with Upcoming / Past / All filters
- Cancel reservations with confirmation
- Persistent storage via Neon Postgres (in-memory fallback for local dev)

## Deploy to Vercel

1. Fork or clone this repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. In Vercel dashboard, go to **Storage** → **Create Database** → **Neon Postgres**
4. The `DATABASE_URL` env var is set automatically
5. Deploy!

## Local Development

```bash
npm install
npm run dev
```

Without `DATABASE_URL`, the app uses an in-memory store (resets on restart).
