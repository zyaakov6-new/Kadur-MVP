import type { Game, Profile, Achievement } from '../types'

export const mockProfile: Profile = {
  id: 'user-1',
  phone: '+972501234567',
  name: 'Lior Kadosh',
  avatar_url: undefined,
  city: 'Tel Aviv',
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
    title: 'Friday Night 5s',
    description: 'Chill pickup game at Yarkon. All levels welcome.',
    format: '5v5',
    status: 'open',
    location_name: 'Yarkon Park Field 3',
    location_lat: 32.103,
    location_lng: 34.797,
    city: 'Tel Aviv',
    scheduled_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    max_players: 10,
    current_players: 7,
    creator_id: 'user-2',
    distance_km: 0.8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'game-2',
    title: 'Saturday Morning Run',
    description: 'Competitive 7-a-side. Bring your best game.',
    format: '7v7',
    status: 'open',
    location_name: 'HaPoel Sports Complex',
    location_lat: 32.081,
    location_lng: 34.781,
    city: 'Tel Aviv',
    scheduled_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    max_players: 14,
    current_players: 11,
    creator_id: 'user-3',
    distance_km: 2.3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'game-3',
    title: 'Sunday League Clash',
    description: '11v11 full pitch. Teams already forming, join now!',
    format: '11v11',
    status: 'full',
    location_name: 'Bloomfield Stadium Annex',
    location_lat: 32.058,
    location_lng: 34.769,
    city: 'Tel Aviv',
    scheduled_at: new Date(Date.now() + 42 * 60 * 60 * 1000).toISOString(),
    max_players: 22,
    current_players: 22,
    creator_id: 'user-4',
    distance_km: 4.1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'game-4',
    title: 'Tuesday Quickfire',
    description: 'Fast 5v5 sets, rotating winners.',
    format: '5v5',
    status: 'open',
    location_name: 'Kikar Hamedina Courts',
    location_lat: 32.085,
    location_lng: 34.792,
    city: 'Tel Aviv',
    scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    max_players: 10,
    current_players: 3,
    creator_id: 'user-5',
    distance_km: 1.6,
    created_at: new Date().toISOString(),
  },
  {
    id: 'game-5',
    title: 'Ramat Gan Derby',
    description: 'Evening game under the lights. Competitive.',
    format: '7v7',
    status: 'open',
    location_name: 'National Stadium Training Pitch',
    location_lat: 32.069,
    location_lng: 34.819,
    city: 'Ramat Gan',
    scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    max_players: 14,
    current_players: 9,
    creator_id: 'user-6',
    distance_km: 5.4,
    created_at: new Date().toISOString(),
  },
]

export const mockAchievements: Achievement[] = [
  { id: 'ach-1', name: 'First Touch', description: 'Joined your first game', icon: '⚽', xp_reward: 50 },
  { id: 'ach-2', name: 'Hat-Trick Hero', description: 'Scored 3 goals in one game', icon: '🎩', xp_reward: 150 },
  { id: 'ach-3', name: 'Playmaker', description: '10 assists total', icon: '🎯', xp_reward: 200 },
  { id: 'ach-4', name: 'Squad Leader', description: 'Created 5 games', icon: '👑', xp_reward: 300 },
  { id: 'ach-5', name: 'Iron Man', description: 'Played 50 games', icon: '🏃', xp_reward: 500 },
]

export function formatGameTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours < 1) {
    const mins = Math.round(diffMs / (1000 * 60))
    return `In ${mins}m`
  }
  if (diffHours < 24) {
    return `In ${Math.round(diffHours)}h`
  }
  const days = Math.floor(diffHours / 24)
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

export function getSpotsLeft(game: Game): number {
  return game.max_players - game.current_players
}

export function getOccupancyPercent(game: Game): number {
  return Math.round((game.current_players / game.max_players) * 100)
}
