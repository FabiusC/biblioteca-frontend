import { NavLink, Outlet } from 'react-router-dom'

import { apiBaseUrl } from '@/services/api'

interface NavItem {
  path: string
  label: string
}

const navItems: NavItem[] = [
  { path: '/home', label: 'Home' },
  { path: '/catalog', label: 'Catalog' },
  { path: '/users', label: 'Usuarios' },
  { path: '/books', label: 'Libros' },
]

export function AppLayout() {
  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <div>
          <p className="eyebrow">Biblioteca SPA</p>
          <h1>Frontend base for Vite, React and TypeScript</h1>
        </div>
        <div className="status-pill">
          <span className="status-dot" />
          <span>{apiBaseUrl}</span>
        </div>
      </header>

      <nav className="nav-card" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="content-shell">
        <Outlet />
      </main>
    </div>
  )
}