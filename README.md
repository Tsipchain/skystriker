# SkyStriker - Tour Guide Platform

AI-powered platform connecting tourists with local tour guides. Part of the **Thronos Ecosystem**.

## Concept

SkyStriker is a marketplace for tour guides. Guides create profiles, list their tours with routes, and manage bookings. Tourists discover tours, book, and pay - with transactions verified on the Thronos blockchain.

**Business Model:** 20% platform commission on all bookings.

## For Tour Guides

- Create professional profile with certifications, languages, specialties
- Build tours with detailed routes, points of interest, pricing
- Manage bookings and schedule
- AI Assistant for daily briefings, earnings tracking, review management
- Weather-integrated tour planning
- ether.fi card integration for instant payouts
- Analytics dashboard (revenue, popular tours, ratings)

## For Tourists

- Browse and search tours by city, category, language, price
- View guide profiles, ratings, and verified reviews
- Book tours with instant confirmation
- Pay via card, crypto, or cash
- Leave verified reviews after completion

## Features

### Tour Guide Side
- Profile management with verification
- Tour creation with route builder (POI mapping)
- Booking management (confirm/cancel/complete)
- Review responses
- AI Assistant (Greek + English):
  - "Τι κρατήσεις έχω αύριο;"
  - "Πόσα έβγαλα αυτόν τον μήνα;"
  - "Γράψε μια περιγραφή για food tour"
  - "Τι καιρό θα κάνει στην Αθήνα;"
- Revenue analytics and performance tracking
- Daily briefing with schedule + weather + tips

### Tourist Side (Public API)
- Search tours by city, category, language, price range, difficulty
- Browse verified guides
- Featured tours discovery
- Real-time availability checking
- Booking with confirmation codes
- Review system with verified bookings

### Blockchain Integration
- All transactions recorded on Thronos blockchain
- Payment verification via blockchain tx hash
- Guide identity verification through Thronos VerifyID

### ether.fi Integration
- Card issuance for guides (instant payouts)
- Liquidity bridging through Thronos chain
- Referral program: https://www.ether.fi/refer/74df90a0

## Tech Stack

- **Backend**: Python / FastAPI (async)
- **Database**: PostgreSQL with SQLAlchemy async ORM
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Auth**: JWT tokens
- **AI**: OpenAI integration + custom NLP
- **Weather**: OpenWeatherMap API
- **Blockchain**: Thronos chain integration
- **Payments**: Card, Crypto, ether.fi cards
- **Deployment**: Railway / Vercel

## API Endpoints

### Public (No Auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/public/tours` | Search tours |
| GET | `/api/v1/public/tours/{id}` | Tour details |
| GET | `/api/v1/public/guides` | Browse guides |
| GET | `/api/v1/public/guides/{id}` | Guide profile |
| GET | `/api/v1/public/featured` | Featured tours |
| GET | `/api/v1/public/cities` | Cities with tours |
| POST | `/api/v1/bookings` | Create booking |
| POST | `/api/v1/reviews` | Leave review |

### Guide (Auth Required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register as guide |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/guides/me` | My profile |
| PUT | `/api/v1/guides/me` | Update profile |
| CRUD | `/api/v1/tours/*` | Tour management |
| GET | `/api/v1/bookings` | My bookings |
| PATCH | `/api/v1/bookings/{id}/confirm` | Confirm booking |
| PATCH | `/api/v1/bookings/{id}/complete` | Complete booking |
| GET | `/api/v1/reviews` | My reviews |
| POST | `/api/v1/reviews/{id}/respond` | Respond to review |
| GET | `/api/v1/analytics/*` | Revenue & stats |
| POST | `/api/v1/assistant/chat` | AI Assistant |
| GET | `/api/v1/assistant/daily-briefing` | Daily briefing |

## Quick Start

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Target Markets

1. **Greece** (launch market) - Athens, Thessaloniki, Santorini, Mykonos, Crete, Rhodes
2. **Mediterranean** - Turkey, Croatia, Italy, Spain, Portugal
3. **Global** - Emerging tourism markets without established platforms

## Part of Thronos Ecosystem

- **thronos-V3.6** - Core blockchain platform
- **thronos-verifyid** - KYC/Identity verification
- **thronos-commerce-assistant** - E-shop AI assistant
- **skystriker** - Tour guide platform (this)
