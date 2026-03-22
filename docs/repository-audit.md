# SkyStriker Repository Audit

## Overview

This document captures the state of the repository after the v2.0.0 rewrite from a tour-booking platform to the Thronos Chain SkyStriker Global Guides platform.

## File Structure

```
skystriker/
├── .env.example
├── .gitignore
├── Procfile
├── README.md
├── nixpacks.toml
├── railway.json
├── docs/
│   ├── platform-audit-and-roadmap.md
│   └── repository-audit.md
├── backend/
│   ├── main.py                      # FastAPI entry-point
│   ├── requirements.txt             # Python dependencies
│   ├── core/
│   │   └── config.py                # Pydantic settings
│   ├── dependencies/
│   │   ├── auth.py                  # Auth helpers (header-based)
│   │   └── database.py              # DB session dependency
│   ├── middleware/
│   │   └── cors.py                  # CORS configuration
│   ├── models/
│   │   ├── base.py                  # SQLAlchemy declarative base
│   │   └── platform.py              # All domain models
│   ├── routers/
│   │   ├── admin.py                 # Admin endpoints
│   │   ├── guide.py                 # Guide endpoints
│   │   ├── health.py                # Health check
│   │   └── public.py                # Public browsing endpoints
│   ├── schemas/
│   │   └── platform.py              # Pydantic request/response schemas
│   ├── services/
│   │   ├── database.py              # Async engine & session factory
│   │   ├── platform.py              # Business logic layer
│   │   └── seed.py                  # Demo data seeder
│   └── tests/
│       └── test_platform_rules.py   # Platform business rule tests
└── frontend/
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── vite.config.ts
    ├── public/
    │   ├── favicon.svg
    │   └── site.webmanifest
    └── src/
        ├── App.tsx                  # Router configuration
        ├── api/client.ts            # Axios API client
        ├── index.css                # Tailwind + custom styles
        ├── main.tsx                 # React entry-point
        ├── vite-env.d.ts            # Vite type declarations
        ├── types/index.ts           # TypeScript interfaces
        ├── components/
        │   ├── AdminLayout.tsx
        │   ├── DashboardLayout.tsx
        │   ├── DiscoveryCard.tsx
        │   ├── LoadingBlock.tsx
        │   ├── PublicLayout.tsx
        │   └── RoleSwitcher.tsx
        └── pages/
            ├── Cities.tsx
            ├── CityDetail.tsx
            ├── Countries.tsx
            ├── ExperienceDetail.tsx
            ├── Experiences.tsx
            ├── GuideProfile.tsx
            ├── Guides.tsx
            ├── Home.tsx
            ├── VerificationExplainer.tsx
            ├── admin/
            │   ├── AdminAudit.tsx
            │   ├── AdminExperiences.tsx
            │   ├── AdminGuides.tsx
            │   ├── AdminReviews.tsx
            │   └── AdminVerifications.tsx
            └── guide/
                ├── GuideAvailability.tsx
                ├── GuideBookingRequests.tsx
                ├── GuideExperiences.tsx
                ├── GuideOverview.tsx
                ├── GuideProfile.tsx
                ├── GuideReviews.tsx
                ├── GuideSettings.tsx
                └── GuideVerification.tsx
```

## Deleted Files (v1 → v2)

The following files from the original tour-booking platform were removed:

### Backend Models
- `models/bookings.py`, `guides.py`, `locations.py`, `notifications.py`, `reviews.py`, `tours.py`

### Backend Routers
- `routers/analytics.py`, `assistant.py`, `auth.py`, `bookings.py`, `guides.py`, `locations.py`, `reviews.py`, `tours.py`

### Backend Schemas
- `schemas/assistant.py`, `bookings.py`, `guides.py`, `locations.py`, `reviews.py`, `tours.py`

### Backend Services
- `services/ai_assistant.py`, `analytics.py`, `auth.py`, `bookings.py`, `notifications.py`, `tours.py`, `weather.py`

### Frontend Components
- `components/BookingCard.tsx`, `ChatWidget.tsx`, `Layout.tsx`, `ReviewCard.tsx`, `Sidebar.tsx`, `StatsCard.tsx`, `TourCard.tsx`

### Frontend Pages
- `pages/Analytics.tsx`, `Assistant.tsx`, `Bookings.tsx`, `Dashboard.tsx`, `Login.tsx`, `Profile.tsx`, `PublicTourView.tsx`, `Reviews.tsx`, `Tours.tsx`

## Known Issues

1. **Auth**: Using header-based `X-Guide-Id` — not production-ready
2. **Availability**: Guide availability page is a placeholder
3. **Settings**: Guide settings page is a placeholder
4. **Payments**: No payment integration yet
5. **Tests**: Minimal test coverage — only business rule tests exist
