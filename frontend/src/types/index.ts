/* ------------------------------------------------------------------ */
/* Domain types for Thronos Chain SkyStriker Global Guides            */
/* ------------------------------------------------------------------ */

export interface Country {
  id: string
  code: string
  name: string
  flag_emoji: string
  is_active: boolean
}

export interface City {
  id: string
  country_id: string
  name: string
  slug: string
  tagline: string
  description: string
  lat: number | null
  lng: number | null
  photo_url: string
  is_active: boolean
  country_name: string
  country_code: string
  guide_count: number
  experience_count: number
}

export interface CityDetail extends City {
  guides: GuideCard[]
  experiences: ExperienceCard[]
}

export interface GuideCard {
  id: string
  full_name: string
  bio: string
  avatar_url: string
  languages: string[]
  specialties: string[]
  city_name: string
  country_name: string
  verification_status: string
  rating: number
  total_reviews: number
}

export interface GuideDetail extends GuideCard {
  email: string
  phone: string
  verifyid_reference: string
  is_active: boolean
  payment_method: string
  stripe_account_id: string
  crypto_wallet_address: string
  created_at: string | null
  experiences: ExperienceCard[]
}

export interface ExperienceCard {
  id: string
  guide_id: string
  city_id: string
  title: string
  slug: string
  description: string
  category: string
  duration_minutes: number
  price: number
  currency: string
  max_guests: number
  languages: string[]
  photo_url: string
  is_active: boolean
  avg_rating: number
  total_bookings: number
  guide_name: string
  city_name: string
}

export interface Booking {
  id: string
  experience_id: string
  guide_id: string
  guest_name: string
  guest_email: string
  guest_phone: string
  requested_date: string
  requested_time: string
  guests_count: number
  total_price: number
  platform_fee: number
  guide_payout: number
  currency: string
  status: string
  note: string
  created_at: string | null
}

export interface Review {
  id: string
  experience_id: string
  guide_id: string
  booking_id: string | null
  reviewer_name: string
  rating: number
  comment: string
  guide_response: string
  is_published: boolean
  is_flagged: boolean
  created_at: string | null
}

export interface AuditEntry {
  id: string
  action: string
  actor: string
  target_type: string
  target_id: string
  detail: string
  created_at: string | null
}

export interface PlatformStats {
  countries: number
  cities: number
  guides: number
  experiences: number
  verified_guides: number
}

export interface HealthResponse {
  status: string
  service: string
  version: string
  environment: string
}

/* Auth */
export interface AuthUser {
  id: string
  email: string
  full_name: string
  avatar_url: string
  role: string
  auth_provider: string
  guide_id: string | null
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

/* Availability */
export interface AvailabilitySlot {
  id: string
  guide_id: string
  date: string
  start_time: string
  end_time: string
  max_bookings: number
  note: string
  is_available: boolean
}

export interface CalendarDay {
  date: string
  is_available: boolean
  start_time: string
  end_time: string
  spots_left: number
}
