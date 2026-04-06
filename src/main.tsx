import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './contexts/LanguageContext'
import { AuthProvider }     from './contexts/AuthContext'
import { GameProvider }     from './contexts/GameContext'
import './index.css'

// Apply saved language direction before first render
const savedLang = localStorage.getItem('kadur-lang') ?? 'he'
document.documentElement.dir  = savedLang === 'he' ? 'rtl' : 'ltr'
document.documentElement.lang = savedLang

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <GameProvider>
            <App />
          </GameProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
)
