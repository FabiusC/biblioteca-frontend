import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="page">
      <section className="card">
        <h2 className="card-title">Page not found</h2>
        <p className="card-text">The route you tried to reach does not exist yet.</p>
        <div className="card-actions">
          <Link className="btn btn-primary" to="/home">
            Back to home
          </Link>
        </div>
      </section>
    </div>
  )
}
