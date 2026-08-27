import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="page">
      <section className="card">
        <h2 className="card-title">Pagina no encontrada</h2>
        <p className="card-text">La pagina que intentas acceder no existe.</p>
        <div className="card-actions">
          <Link className="btn btn-primary" to="/home">
            Volver al inicio
          </Link>
        </div>
      </section>
    </div>
  );
}
