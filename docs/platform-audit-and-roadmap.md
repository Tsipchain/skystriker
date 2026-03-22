# SkyStriker Global Guides — Platform Audit & Roadmap

## Current State (v2.0.0)

The platform has been rewritten from a tour-booking marketplace to a **verified local guides and destination experiences** platform under the Thronos Chain ecosystem.

### What's Implemented

#### Backend
- **Domain models**: Country, City, Guide, Experience, Booking, Review, AuditLog
- **Public API**: Browse countries, cities, guides, experiences with filtering
- **Guide API**: Profile management, verification submission, experience CRUD, booking management
- **Admin API**: Guide/verification/experience/review management, audit log
- **Services**: Platform service layer, database management, demo seed data
- **Health check**: Railway-compatible `/health` endpoint

#### Frontend
- **Public pages**: Home, Countries, Cities, CityDetail, Guides, GuideProfile, Experiences, ExperienceDetail, VerificationExplainer
- **Guide dashboard**: Overview, Profile, Verification, Experiences, Availability (placeholder), Bookings, Reviews, Settings (placeholder)
- **Admin dashboard**: Guides, Verifications, Experiences, Reviews, Audit log
- **Shared components**: PublicLayout, DashboardLayout, AdminLayout, DiscoveryCard, LoadingBlock, RoleSwitcher

### Architecture Decisions
- SQLite for development, PostgreSQL for production (async SQLAlchemy)
- Header-based auth (`X-Guide-Id`) for rapid development — JWT planned
- Demo seed data enabled by default for easy onboarding
- Tailwind CSS with minimal custom styles

---

## Roadmap

### Phase 1 — Core Hardening
- [ ] Replace header-based auth with JWT / OAuth 2.0
- [ ] Add input validation and rate limiting
- [ ] PostgreSQL migration scripts (Alembic)
- [ ] Error monitoring (Sentry)
- [ ] Unit and integration test coverage

### Phase 2 — Verification Integration
- [ ] Connect Thronos VerifyID API for real identity verification
- [ ] Document upload for guide credentials
- [ ] Automated verification pipeline with admin review
- [ ] Verification badge display on public profiles

### Phase 3 — Booking & Payments
- [ ] Full booking flow with calendar availability
- [ ] Payment integration (Stripe, crypto via Thronos chain)
- [ ] ether.fi card payouts for guides
- [ ] Booking confirmation emails / notifications
- [ ] Cancellation and refund policies

### Phase 4 — Discovery & Growth
- [ ] Search with full-text indexing
- [ ] Map-based experience discovery
- [ ] Recommendation engine
- [ ] Multi-language support (Greek, English, +)
- [ ] SEO-optimised public pages
- [ ] Mobile-responsive PWA

### Phase 5 — Ecosystem Integration
- [ ] Thronos blockchain transaction recording
- [ ] Cross-platform guide reputation (VerifyID ↔ SkyStriker)
- [ ] Commerce assistant integration for guide communications
- [ ] Analytics dashboard with revenue tracking
