import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
  arrayUnion, arrayRemove, increment,
} from 'firebase/firestore'
import { db, FIREBASE_READY } from '../lib/firebase'
import { mockGames } from '../data/mockData'
import { useAuth } from './AuthContext'
import type { Game } from '../types'

interface GameContextValue {
  games:        Game[]
  loading:      boolean
  joinedIds:    Set<string>
  joinGame:     (id: string) => Promise<void>
  leaveGame:    (id: string) => Promise<void>
  hasJoined:    (id: string) => boolean
  addGame:      (game: Game) => Promise<void>
  refreshGames: () => void
  readChats:    Set<string>
  markChatRead: (id: string) => void
}

const GameContext = createContext<GameContextValue | null>(null)

const READ_KEY    = 'kadur-read-chats'
const JOINED_KEY  = 'kadur-joined'
const CREATED_KEY = 'kadur-created-games'

// Convert a Firestore doc snapshot to our Game type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function snapToGame(id: string, data: any): Game {
  return {
    id,
    title:           data.title,
    description:     data.description ?? undefined,
    format:          data.format,
    status:          data.status,
    location_name:   data.location_name,
    location_lat:    data.location_lat,
    location_lng:    data.location_lng,
    city:            data.city,
    scheduled_at:    data.scheduled_at?.toDate
      ? data.scheduled_at.toDate().toISOString()
      : data.scheduled_at,
    max_players:     data.max_players,
    current_players: data.current_players ?? 0,
    creator_id:      data.creator_id,
    participant_ids: data.participant_ids ?? [],
    lineup:          data.lineup      ?? undefined,
    game_roles:      data.game_roles  ?? undefined,
    created_at:      data.created_at?.toDate
      ? data.created_at.toDate().toISOString()
      : (data.created_at ?? new Date().toISOString()),
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const [games, setGames]     = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  const [readChats, setReadChats] = useState<Set<string>>(() => {
    try {
      const s = localStorage.getItem(READ_KEY)
      return s ? new Set(JSON.parse(s)) : new Set()
    } catch { return new Set() }
  })

  useEffect(() => {
    localStorage.setItem(READ_KEY, JSON.stringify([...readChats]))
  }, [readChats])

  // ── Derived: which games has this user joined? ───────────────────────────
  const joinedIds = new Set(
    games
      .filter(g => user && (g.participant_ids ?? []).includes(user.id))
      .map(g => g.id)
  )

  // ── Real-time listener on all games ──────────────────────────────────────
  const setupListener = useCallback(() => {
    if (!FIREBASE_READY) {
      // Dev fallback
      try {
        const stored = localStorage.getItem(CREATED_KEY)
        const created: Game[] = stored ? JSON.parse(stored) : []
        setGames([...created, ...mockGames])
      } catch {
        setGames([...mockGames])
      }
      setLoading(false)
      return () => {}
    }

    setLoading(true)
    const q = query(collection(db, 'games'), orderBy('scheduled_at', 'asc'))
    const unsub = onSnapshot(q, snapshot => {
      setGames(snapshot.docs.map(d => snapToGame(d.id, d.data())))
      setLoading(false)
    }, () => {
      // On error fallback to mock
      setGames([...mockGames])
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = setupListener()
    return () => { if (typeof unsub === 'function') unsub() }
  }, [setupListener])

  // ── Join ─────────────────────────────────────────────────────────────────
  async function joinGame(id: string) {
    if (!user) return

    // Optimistic
    setGames(gs => gs.map(g =>
      g.id === id
        ? { ...g,
            participant_ids: [...(g.participant_ids ?? []), user.id],
            current_players: g.current_players + 1,
            status: g.current_players + 1 >= g.max_players ? 'full' : g.status }
        : g
    ))

    if (!FIREBASE_READY) {
      const next = new Set([...joinedIds, id])
      localStorage.setItem(JOINED_KEY, JSON.stringify([...next]))
      return
    }

    try {
      await updateDoc(doc(db, 'games', id), {
        participant_ids: arrayUnion(user.id),
        current_players: increment(1),
      })
    } catch {
      // Revert
      setGames(gs => gs.map(g =>
        g.id === id
          ? { ...g,
              participant_ids: (g.participant_ids ?? []).filter(uid => uid !== user.id),
              current_players: Math.max(0, g.current_players - 1) }
          : g
      ))
    }
  }

  // ── Leave ────────────────────────────────────────────────────────────────
  async function leaveGame(id: string) {
    if (!user) return

    // Optimistic
    setGames(gs => gs.map(g =>
      g.id === id
        ? { ...g,
            participant_ids: (g.participant_ids ?? []).filter(uid => uid !== user.id),
            current_players: Math.max(0, g.current_players - 1),
            status: 'open' }
        : g
    ))

    if (!FIREBASE_READY) {
      const next = new Set(joinedIds)
      next.delete(id)
      localStorage.setItem(JOINED_KEY, JSON.stringify([...next]))
      return
    }

    try {
      await updateDoc(doc(db, 'games', id), {
        participant_ids: arrayRemove(user.id),
        current_players: increment(-1),
      })
    } catch {
      // Revert
      setGames(gs => gs.map(g =>
        g.id === id
          ? { ...g,
              participant_ids: [...(g.participant_ids ?? []), user.id],
              current_players: g.current_players + 1 }
          : g
      ))
    }
  }

  // ── Create game ──────────────────────────────────────────────────────────
  async function addGame(game: Game) {
    if (!FIREBASE_READY) {
      // Dev: persist locally
      const withJoin = { ...game, participant_ids: [user?.id ?? 'user-1'], current_players: 1 }
      setGames(gs => [withJoin, ...gs])
      const created = [withJoin, ...games.filter(g => g.creator_id === (user?.id ?? 'user-1'))]
      localStorage.setItem(CREATED_KEY, JSON.stringify(created))
      localStorage.setItem(JOINED_KEY, JSON.stringify([...joinedIds, game.id]))
      return
    }

    try {
      const docRef = await addDoc(collection(db, 'games'), {
        title:           game.title,
        description:     game.description ?? null,
        format:          game.format,
        status:          'open',
        location_name:   game.location_name,
        location_lat:    game.location_lat,
        location_lng:    game.location_lng,
        city:            game.city,
        scheduled_at:    new Date(game.scheduled_at),
        max_players:     game.max_players,
        current_players: 1,
        creator_id:      user!.id,
        participant_ids: [user!.id],
        created_at:      serverTimestamp(),
      })
      // onSnapshot will update games list automatically;
      // just make sure joinedIds picks up the new game (it derives from games)
      // The addDoc returns the real ID — the snapshot listener handles the rest
      void docRef  // suppress unused warning
    } catch (e) {
      console.error('addGame failed', e)
    }
  }

  const hasJoined    = (id: string) => joinedIds.has(id)
  const markChatRead = (id: string) => setReadChats(s => new Set([...s, id]))

  return (
    <GameContext.Provider value={{
      games, loading,
      joinedIds, joinGame, leaveGame, hasJoined,
      addGame, refreshGames: setupListener,
      readChats, markChatRead,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be inside GameProvider')
  return ctx
}
