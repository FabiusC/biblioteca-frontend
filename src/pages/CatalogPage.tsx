import { Link } from 'react-router-dom'

export function CatalogPage() {
  return (
    <div className="page">
      <section className="card">
        <h2 className="card-title">Catalog</h2>
        <p className="card-text">
          Accesos rápidos a las vistas de administración de la biblioteca.
        </p>
        <div className="grid-layout">
          <div className="card">
            <h3 className="card-title">Books</h3>
            <p className="card-meta">List and manage the collection.</p>
            <div className="card-actions">
              <Link className="btn btn-primary" to="/books">
                Ver libros
              </Link>
            </div>
          </div>
          <div className="card">
            <h3 className="card-title">Loans</h3>
            <p className="card-meta">Track active and returned loans.</p>
            <div className="card-actions">
              <Link className="btn btn-primary" to="/loans">
                Ver préstamos
              </Link>
            </div>
          </div>
          <div className="card">
            <h3 className="card-title">Users</h3>
            <p className="card-meta">Prepare the member management flow.</p>
            <div className="card-actions">
              <Link className="btn btn-primary" to="/users">
                Ver usuarios
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
