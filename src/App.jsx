import { HashRouter, Routes, Route } from 'react-router-dom'
import { useState, useMemo } from 'react'
import TerminalLayout from './components/TerminalLayout'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import Opportunities from './pages/Opportunities'
import About from './pages/About'
import { THEMES } from './data/sources'
import './App.css'

export default function App() {
  const [theme, setTheme] = useState('matrix')
  const [searchQuery, setSearchQuery] = useState('')

  const themeClass = useMemo(() => THEMES.find(t => t.id === theme)?.id || 'matrix', [theme])

  return (
    <HashRouter>
      <div className={`app theme-${themeClass}`}>
        <Routes>
          <Route path="/" element={
            <TerminalLayout theme={theme} setTheme={setTheme}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}>
              <Dashboard searchQuery={searchQuery} />
            </TerminalLayout>
          } />
          <Route path="/jobs" element={
            <TerminalLayout theme={theme} setTheme={setTheme}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}>
              <Jobs searchQuery={searchQuery} />
            </TerminalLayout>
          } />
          <Route path="/opportunities" element={
            <TerminalLayout theme={theme} setTheme={setTheme}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}>
              <Opportunities searchQuery={searchQuery} />
            </TerminalLayout>
          } />
          <Route path="/about" element={
            <TerminalLayout theme={theme} setTheme={setTheme}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}>
              <About />
            </TerminalLayout>
          } />
        </Routes>
      </div>
    </HashRouter>
  )
}
