# Thronos Chain SkyStriker Global Guides

Verified local guides & destination experiences. Part of the **Thronos Chain** ecosystem.

## Concept

SkyStriker connects travellers with verified local guides who offer authentic destination experiences. Guides create profiles, list experiences across cities and countries, and manage bookings — all backed by Thronos Chain verification.

**Business Model:** 15 % platform commission on completed bookings.

## For Guides

- Create a professional profile with bio, languages, specialties
- Submit for identity verification via Thronos VerifyID
- List experiences with pricing, descriptions, and categories
- Manage booking requests (confirm / decline)
- View reviews and ratings from guests

## For Travellers

- Browse countries, cities, and experiences
- Filter by category: food, history, nature, nightlife, adventure, culture, wellness, photography
- View guide profiles with verification badges and ratings
- Book experiences directly
- Leave reviews after completion

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python / FastAPI (async) |
| Database | SQLite (dev) / PostgreSQL (prod) via SQLAlchemy async |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Auth | Header-based demo auth (JWT planned) |
| Verification | Thronos VerifyID integration |
| Deployment | Railway via Nixpacks |

## API Overview

### Public (`/api/v1/public/`)
- `GET /countries` — List countries with guide counts
- `GET /cities` — List cities, optionally filter by country
- `GET /cities/{slug}` — City detail with guides & experiences
- `GET /guides` — Browse verified guides
- `GET /guides/{id}` — Guide profile with experiences & reviews
- `GET /experiences` — Search experiences by city, category, price
- `GET /experiences/{id}` — Experience detail

### Guide (`/api/v1/guide/`)
- `GET /me` — Current guide profile
- `PATCH /me` — Update profile
- `POST /verification/submit` — Submit for verification
- `CRUD /experiences` — Manage experiences
- `GET /bookings` — List bookings
- `POST /bookings/{id}/confirm|decline` — Handle booking requests
- `GET /reviews` — View received reviews

### Admin (`/api/v1/admin/`)
- Guide management and verification approval
- Experience moderation
- Review moderation
- Audit log

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

Set `SEED_DEMO_DATA=true` (default) to populate demo countries, cities, guides, and experiences on first run.

## Part of Thronos Ecosystem

- **thronos-V3.6** — Core blockchain platform
- **thronos-verifyid** — KYC / Identity verification
- **thronos-commerce-assistant** — E-shop AI assistant
- **skystriker** — Global guides platform (this)
