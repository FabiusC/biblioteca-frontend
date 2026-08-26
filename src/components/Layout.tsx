import { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';

export const Layout = () => {
  const [isDark, setIsDark] = useState(false);

  // Aplica o quita .dark-theme en el elemento raiz segun el estado
  useEffect(() => {
    document.documentElement.classList.toggle('dark-theme', isDark);
  }, [isDark]);

  return (
    <div>
      <nav className="container" style={{ padding: '1rem 0' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem',
          }}
        >
          <Link to="/">Inicio</Link>
          <Link to="/users">Usuarios</Link>
          <Link to="/books">Libros</Link>
          <Link to="/loans">Préstamos</Link>
          <button
            className="btn"
            onClick={() => setIsDark(!isDark)}
            aria-label="Alternar tema"
          >
            {isDark ? 'Modo Claro' : 'Modo Oscuro'}
          </button>
        </div>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
};
