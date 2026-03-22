export interface Tour {
  id: string
  guide_id: string
  title: string
  description?: string
  short_description?: string
  category: string
  languages: string[]
  duration_hours: number
  max_participants: number
  min_participants: number
  price_per_person: number
  group_price?: number
  currency: string
  meeting_point?: string
  meeting_point_lat?: number
  meeting_point_lng?: number
  city?: string
  country: string
  region?: string
  route_points: RoutePoint[]
  included_items: string[]
  excluded_items: string[]
  what_to_bring: string[]
  difficulty_level: string
  photos: string[]
  tags: string[]
  is_active: boolean
  is_featured: boolean
  total_bookings: number
  avg_rating: number
  created_at: string
}

export interface RoutePoint {
  name: string
  lat?: number
  lng?: number
  description?: string
  duration_minutes: number
  photos: string[]
}

export interface Booking {
  id: string
  tour_id: string
  guide_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  tour_date: string
  tour_time?: string
  participants_count: number
  price_per_person: number
  total_price: number
  platform_commission: number
  guide_payout: number
  currency: string
  payment_status: string
  status: string
  special_requests?: string
  confirmation_code?: string
  created_at: string
}

export interface Review {
  id: string
  tour_id: string
  guide_id: string
  customer_name: string
  rating: number
  title?: string
  comment?: string
  guide_response?: string
  responded_at?: string
  is_verified: boolean
  created_at: string
}

export interface Guide {
  id: string
  name: string
  bio?: string
  languages: string[]
  specialties: string[]
  verified: boolean
  rating: number
  total_tours: number
  total_reviews: number
  location_city?: string
  location_country: string
  hourly_rate: number
  currency: string
  profile_image_url?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  data?: any
  suggested_actions?: { label: string; action: string; params: any }[]
}

export interface DailyBriefing {
  date: string
  bookings_today: any[]
  total_participants: number
  revenue_today: number
  pending_reviews: number
  weather?: any
  tips: string[]
}
