import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './contexts/LanguageContext'
import './index.css'

// Set initial direction before first render
const savedLang = localStorage.getItem('kadur-lang') ?? 'he'
document.documentElement.dir  = savedLang === 'he' ? 'rtl' : 'ltr'
document.documentElement.lang = savedLang

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
)
