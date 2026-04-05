export type GameFormat = '5v5' | '7v7' | '11v11'
export type GameStatus = 'open' | 'full' | 'cancelled' | 'finished'
export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD' | 'ANY'

export interface Profile {
  id: string
  phone: string
  name: string
  avatar_url?: string
  city?: string
  position: PlayerPosition
  stats: {
    goals: number
    assists: number
    games_played: number
    mvp_count: number
    xp: number
    level: number
  }
  created_at: string
}

export interface Game {
  id: string
  title: string
  description?: string
  format: GameFormat
  status: GameStatus
  location_name: string
  location_lat: number
  location_lng: number
  city: string
  scheduled_at: string
  max_players: number
  current_players: number
  creator_id: string
  creator?: Profile
  distance_km?: number
  created_at: string
}

export interface Message {
  id: string
  game_id: string
  sender_id: string
  sender?: Profile
  content: string
  created_at: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  xp_reward: number
}

export interface Participant {
  id: string
  game_id: string
  user_id: string
  profile?: Profile
  team: 'A' | 'B' | null
  position?: PlayerPosition
  status: 'confirmed' | 'pending' | 'withdrawn'
  joined_at: string
}
