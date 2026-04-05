import type { Game, Profile, Achievement } from '../types'

export const mockProfile: Profile = {
  id: 'user-1',
  phone: '+972501234567',
  name: 'ליאור קדוש',
  avatar_url: undefined,
  city: 'תל אביב',
  position: 'MID',
  stats: {
    goals: 34,
    assists: 18,
    games_played: 57,
    mvp_count: 12,
    xp: 2840,
    level: 8,
  },
  created_at: '2025-09-15T10:00:00Z',
}

export const mockGames: Game[] = [
  {
    id: 'game-1',
    title: 'חמישיות שישי בלילה',
    description: 'משחק נינוח בפארק הירקון. כל הרמות מוזמנות.',
    format: '5v5',
    status: 'open',
    location_name: 'מגרש 3 פארק הירקון',
    location_lat: 32.103,
    location_lng: 34.797,
    city: 'תל אביב',
    scheduled_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    max_players: 10,
    current_players: 7,
    creator_id: 'user-2',
    distance_km: 0.8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'game-2',
    title: 'ריצת בוקר שבת',
    description: '7 על 7 תחרותי. תביאו את המשחק הכי טוב שלכם.',
    format: '7v7',
    status: 'open',
    location_name: 'מתחם הספורט הפועל',
    location_lat: 32.081,
    location_lng: 34.781,
    city: 'תל אביב',
    scheduled_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    max_players: 14,
    current_players: 11,
    creator_id: 'user-3',
    distance_km: 2.3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'game-3',
    title: 'דרבי ליגת ראשון',
    description: 'מגרש מלא 11 על 11. הקבוצות מתגבשות, הצטרפו עכשיו!',
    format: '11v11',
    status: 'full',
    location_name: 'אנקס אצטדיון בלומפילד',
    location_lat: 32.058,
    location_lng: 34.769,
    city: 'תל אביב',
    scheduled_at: new Date(Date.now() + 42 * 60 * 60 * 1000).toISOString(),
    max_players: 22,
    current_players: 22,
    creator_id: 'user-4',
    distance_km: 4.1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'game-4',
    title: 'חמישיות מהירות שלישי',
    description: 'סטים מהירים של 5 על 5, מחליפים מנצחים.',
    format: '5v5',
    status: 'open',
    location_name: 'מגרשי כיכר המדינה',
    location_lat: 32.085,
    location_lng: 34.792,
    city: 'תל אביב',
    scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    max_players: 10,
    current_players: 3,
    creator_id: 'user-5',
    distance_km: 1.6,
    created_at: new Date().toISOString(),
  },
  {
    id: 'game-5',
    title: 'דרבי רמת גן',
    description: 'משחק ערב תחת האורות. תחרותי.',
    format: '7v7',
    status: 'open',
    location_name: 'מגרש אימונים אצטדיון לאומי',
    location_lat: 32.069,
    location_lng: 34.819,
    city: 'רמת גן',
    scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    max_players: 14,
    current_players: 9,
    creator_id: 'user-6',
    distance_km: 5.4,
    created_at: new Date().toISOString(),
  },
]

export const gameTitlesEn: Record<string, { title: string; description: string; location: string; city: string }> = {
  'game-1': { title: 'Friday Night 5s',       description: 'Chill pickup game at Yarkon. All levels welcome.', location: 'Yarkon Park Field 3',          city: 'Tel Aviv'  },
  'game-2': { title: 'Saturday Morning Run',  description: 'Competitive 7-a-side. Bring your best game.',     location: 'HaPoel Sports Complex',         city: 'Tel Aviv'  },
  'game-3': { title: 'Sunday League Clash',   description: '11v11 full pitch. Teams forming, join now!',      location: 'Bloomfield Stadium Annex',      city: 'Tel Aviv'  },
  'game-4': { title: 'Tuesday Quickfire',     description: 'Fast 5v5 sets, rotating winners.',                location: 'Kikar Hamedina Courts',         city: 'Tel Aviv'  },
  'game-5': { title: 'Ramat Gan Derby',       description: 'Evening game under the lights. Competitive.',     location: 'National Stadium Training Pitch', city: 'Ramat Gan' },
}

export const mockAchievements: Achievement[] = [
  { id: 'ach-1', name: 'First Touch',    description: 'Joined your first game',      icon: '⚽', xp_reward: 50  },
  { id: 'ach-2', name: 'Hat-Trick Hero', description: 'Scored 3 goals in one game',  icon: '🎩', xp_reward: 150 },
  { id: 'ach-3', name: 'Playmaker',      description: '10 assists total',            icon: '🎯', xp_reward: 200 },
  { id: 'ach-4', name: 'Squad Leader',   description: 'Created 5 games',             icon: '👑', xp_reward: 300 },
  { id: 'ach-5', name: 'Iron Man',       description: 'Played 50 games',             icon: '🏃', xp_reward: 500 },
]

export function getOccupancyPercent(game: Game): number {
  return Math.round((game.current_players / game.max_players) * 100)
}

export function getSpotsLeft(game: Game): number {
  return game.max_players - game.current_players
}
