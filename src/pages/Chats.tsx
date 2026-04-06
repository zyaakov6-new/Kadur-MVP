import { useNavigate } from 'react-router-dom'
import { MessageCircle, Clock } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'
import { useGame } from '../contexts/GameContext'

const mockPreviews: Record<string, { text: string; textHe: string; time: string }> = {
  'game-1': { text: 'Anyone bringing a ball?', textHe: 'מישהו מביא כדור?', time: '2m' },
  'game-2': { text: 'See you all at 8 sharp!', textHe: 'נתראה ב-8 בדיוק!',  time: '15m' },
  'game-3': { text: 'Game is on 🔥',            textHe: 'המשחק מתקיים 🔥',  time: '1h' },
}

export default function Chats() {
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const { games, joinedIds, readChats } = useGame()

  const now = Date.now()
  // Show chats only for games the user joined and that haven't finished more than 2h ago
  const myGames = games.filter(g =>
    joinedIds.has(g.id) &&
    new Date(g.scheduled_at).getTime() > now - 2 * 60 * 60 * 1000
  )

  return (
    <div className="min-h-screen page-enter" style={{ paddingBottom: 'calc(80px + var(--safe-bottom))' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="gradient-radial-green absolute inset-0" />
        <div className="pitch-lines absolute inset-0 opacity-30" />
      </div>

      <header className="relative z-10 px-5 pt-14 pb-6">
        <h1 className="font-display text-4xl tracking-wider mb-1">{t.chats.title}</h1>
        <p className="text-secondary text-sm">{t.chats.subtitle}</p>
      </header>

      <div className="relative z-10 px-5 space-y-3">
        {myGames.length === 0 ? (
          <div className="glass-card py-16 flex flex-col items-center gap-3 text-center">
            <MessageCircle size={40} className="text-muted" />
            <p className="font-heading font-bold">{t.chats.no_chats}</p>
            <p className="text-secondary text-sm">{t.chats.join_game}</p>
          </div>
        ) : (
          myGames.map((game, i) => {
            const preview = mockPreviews[game.id]
            const isUnread = !readChats.has(game.id)
            return (
              <button
                key={game.id}
                onClick={() => navigate(`/game/${game.id}/chat`)}
                className="glass-card-hover w-full text-left p-4 opacity-0 animate-fade-up fill-forwards"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-display text-lg"
                      style={{ background: 'linear-gradient(135deg, rgba(0,90,60,0.4), rgba(0,90,60,0.15))', border: '1px solid rgba(0,90,60,0.3)' }}
                    >
                      ⚽
                    </div>
                    <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full border-2 bg-green-400" style={{ borderColor: '#0a0e0c' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-heading font-bold text-sm truncate">{game.title}</h3>
                      <span className="text-[10px] font-heading text-muted flex items-center gap-1 flex-shrink-0 ms-2">
                        <Clock size={9} />{preview?.time ?? ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-secondary text-xs truncate">
                        {preview ? (lang === 'he' ? preview.textHe : preview.text) : (lang === 'he' ? 'התחל שיחה...' : 'Start chatting...')}
                      </p>
                      {isUnread && (
                        <span
                          className="flex-shrink-0 ms-2 w-2 h-2 rounded-full"
                          style={{ background: '#FF5A1F' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
