export function CatalogPage() {
  return (
    <section className="panel-card">
      <p className="eyebrow">Catalog</p>
      <h2>Ready for book, loan and user views</h2>
      <p>
        Use the shared axios client from <span className="inline-code">src/services/api.ts</span> to connect this page to the backend.
      </p>
      <div className="panel-grid">
        <article className="mini-card">
          <strong>Books</strong>
          <span>List and manage the collection.</span>
        </article>
        <article className="mini-card">
          <strong>Loans</strong>
          <span>Track active and returned loans.</span>
        </article>
        <article className="mini-card">
          <strong>Users</strong>
          <span>Prepare the member management flow.</span>
        </article>
      </div>
    </section>
  )
}