import { useState, useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'

export const Layout = () => {
  const [isDark, setIsDark] = useState(false)

  // toggle dark theme on the document root
  useEffect(() => {
    document.documentElement.classList.toggle('dark-theme', isDark)
  }, [isDark])

  return (
    <div>
      <nav className="navbar container">
        <div className="nav-links">
          <Link to="/">Inicio</Link>
          <Link to="/users">Usuarios</Link>
          <Link to="/books">Libros</Link>
          <Link to="/loans">Préstamos</Link>
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => setIsDark(!isDark)}
            aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {isDark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
          </button>
        </div>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </div>
  )
}
