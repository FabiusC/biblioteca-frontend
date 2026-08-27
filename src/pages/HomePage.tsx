import { Link } from "react-router-dom";
import { apiBaseUrl } from "@/services/api";

export function HomePage() {
  return (
    <div className="page">
      <section className="card">
        <h2 className="card-title">Biblioteca</h2>
        <p className="card-text">
          Gestión de usuarios, libros y préstamos con React Router y un cliente
          axios compartido.
        </p>
        <p className="card-meta">API: {apiBaseUrl}/api</p>
        <div className="card-actions">
          <Link className="btn btn-primary" to="/catalog">
            Open catalog
          </Link>
        </div>
      </section>
    </div>
  );
}
