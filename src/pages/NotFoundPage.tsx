import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="panel-card not-found-card">
      <p className="eyebrow">404</p>
      <h2>Page not found</h2>
      <p>The route you tried to reach does not exist yet.</p>
      <Link className="secondary-action" to="/home">
        Back to home
      </Link>
    </section>
  )
}