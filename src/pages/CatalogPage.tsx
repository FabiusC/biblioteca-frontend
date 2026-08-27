import { Link } from "react-router-dom";

export function CatalogPage() {
  return (
    <div className="page">
      <section className="card">
        <h2 className="card-title">Catalogo</h2>
        <p className="card-text">
          Accesos rápidos a las vistas de administración de la biblioteca.
        </p>
        <div className="grid-layout">
          <div className="card">
            <h3 className="card-title">Libros</h3>
            <p className="card-meta">Gestiona la colección de libros.</p>
            <div className="card-actions">
              <Link className="btn btn-primary" to="/books">
                Ver libros
              </Link>
            </div>
          </div>
          <div className="card">
            <h3 className="card-title">Préstamos</h3>
            <p className="card-meta">Gestiona los préstamos de libros.</p>
            <div className="card-actions">
              <Link className="btn btn-primary" to="/loans">
                Ver préstamos
              </Link>
            </div>
          </div>
          <div className="card">
            <h3 className="card-title">Usuarios</h3>
            <p className="card-meta">Gestiona la lista de usuarios.</p>
            <div className="card-actions">
              <Link className="btn btn-primary" to="/users">
                Ver usuarios
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
