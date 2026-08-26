import { NavLink } from 'react-router-dom'
import { THEMES } from '../data/sources'

export default function TerminalLayout({ theme, setTheme, searchQuery, setSearchQuery, children }) {
  return (
    <div className="terminal-layout">
      <header className="terminal-header">
        <div className="terminal-logo">
          {'>'} JOB<span>_TERMINAL</span> <span style={{fontSize:'0.7rem', opacity:0.5}}>v1.0.0</span>
        </div>

        <nav className="terminal-nav">
          <NavLink to="/" className={({isActive}) => isActive ? 'active' : ''} end>
            [DASHBOARD]
          </NavLink>
          <NavLink to="/jobs" className={({isActive}) => isActive ? 'active' : ''}>
            [JOBS]
          </NavLink>
          <NavLink to="/opportunities" className={({isActive}) => isActive ? 'active' : ''}>
            [OPPORTUNITIES]
          </NavLink>
          <NavLink to="/about" className={({isActive}) => isActive ? 'active' : ''}>
            [ABOUT]
          </NavLink>
        </nav>

        <div className="terminal-search">
          <input
            type="text"
            placeholder="search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="theme-select"
          value={theme}
          onChange={e => setTheme(e.target.value)}
        >
          {THEMES.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </header>

      <main className="terminal-content">
        {children}
      </main>
    </div>
  )
}
