import { Link } from 'react-router-dom'

import { apiBaseUrl } from '@/services/api'

export function HomePage() {
  return (
    <section className="hero-card">
      <div>
        <p className="eyebrow">SPA starter</p>
        <h2>Prepared for routing, API integration and container delivery</h2>
      </div>
      <p className="hero-copy">
        This baseline already wires React Router, an axios client and a static deployment path for nginx.
      </p>
      <div className="hero-grid">
        <article className="info-card">
          <span className="info-label">API base URL</span>
          <strong>{apiBaseUrl}</strong>
        </article>
        <article className="info-card">
          <span className="info-label">Navigation</span>
          <strong>Home and catalog routes</strong>
        </article>
        <article className="info-card">
          <span className="info-label">Delivery</span>
          <strong>Multi-stage Docker build</strong>
        </article>
      </div>
      <Link className="primary-action" to="/catalog">
        Open catalog
      </Link>
    </section>
  )
}