import { useEffect, useState } from 'react'
import { createLoan, searchLoans } from '@/services/loanService'
import {
  getAvailableCopies,
  getAvailableCopiesList,
  getBooks,
} from '@/services/bookService'
import type { Book, Loan } from '@/types'

// Modos de orden / filtro para el selector de libros
type BookSortMode = 'isbn' | 'available' | 'alpha'

export function LoansPage() {
  // Busqueda de prestamos existentes
  const [searchUserId, setSearchUserId] = useState('')
  const [searchBookId, setSearchBookId] = useState('')
  const [loans, setLoans] = useState<Loan[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Modal de registro
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [booksLoading, setBooksLoading] = useState(false)
  const [availabilityByIsbn, setAvailabilityByIsbn] = useState<Record<string, number>>({})
  const [bookSortMode, setBookSortMode] = useState<BookSortMode>('alpha')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const [copies, setCopies] = useState<number[]>([])
  const [selectedCopyId, setSelectedCopyId] = useState('')
  const [copiesLoading, setCopiesLoading] = useState(false)
  const [copiesError, setCopiesError] = useState<string | null>(null)

  const [loanUserId, setLoanUserId] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

  // Busca prestamos por userId y bookId
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchUserId.trim() || !searchBookId.trim()) {
      setSearchError('userId y bookId son obligatorios')
      return
    }
    const uid = Number(searchUserId)
    const bid = Number(searchBookId)
    if (Number.isNaN(uid) || Number.isNaN(bid)) {
      setSearchError('IDs deben ser numéricos')
      return
    }
    try {
      setSearchLoading(true)
      setSearchError(null)
      setHasSearched(true)
      const data = await searchLoans(uid, bid)
      if (!data || data.length === 0) {
        setLoans([])
        setSearchError('No se encontraron préstamos')
      } else {
        setLoans(data)
      }
    } catch {
      setLoans([])
      setSearchError('Error al buscar préstamos')
    } finally {
      setSearchLoading(false)
    }
  }

  // Carga el catalogo y el conteo de ejemplares libres por ISBN
  const loadBooksForModal = async () => {
    try {
      setBooksLoading(true)
      const data = await getBooks()
      setBooks(data)

      const pairs = await Promise.all(
        data.map(async (book) => {
          try {
            const count = await getAvailableCopies(book.isbn)
            return [book.isbn, count] as const
          } catch {
            return [book.isbn, 0] as const
          }
        }),
      )
      setAvailabilityByIsbn(Object.fromEntries(pairs))
    } catch {
      setBooks([])
      setAvailabilityByIsbn({})
    } finally {
      setBooksLoading(false)
    }
  }

  const openCreateModal = () => {
    setSelectedBook(null)
    setCopies([])
    setSelectedCopyId('')
    setCopiesError(null)
    setLoanUserId('')
    setCreateError(null)
    setCreateSuccess(null)
    setBookSortMode('alpha')
    setIsModalOpen(true)
    loadBooksForModal()
  }

  const resetModal = () => {
    setIsModalOpen(false)
    setSelectedBook(null)
    setCopies([])
    setSelectedCopyId('')
    setCopiesError(null)
    setLoanUserId('')
    setCreateError(null)
    setCreateSuccess(null)
  }

  const closeModal = () => {
    if (createLoading) return
    resetModal()
  }

  // Aplica filtro y orden local segun el modo elegido
  const getDisplayedBooks = (): Book[] => {
    let list = [...books]

    if (bookSortMode === 'available') {
      // Solo libros con al menos un ejemplar libre
      list = list.filter((book) => (availabilityByIsbn[book.isbn] ?? 0) > 0)
    }

    if (bookSortMode === 'isbn') {
      // Orden por ISBN (texto)
      list.sort((a, b) => a.isbn.localeCompare(b.isbn))
    } else if (bookSortMode === 'alpha') {
      // Orden alfabetico por titulo
      list.sort((a, b) =>
        a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }),
      )
    } else if (bookSortMode === 'available') {
      // Tras filtrar, ordena por titulo para lectura estable
      list.sort((a, b) =>
        a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }),
      )
    }

    return list
  }

  // Al elegir un libro, carga la lista de IDs de ejemplares disponibles
  const handleSelectBook = async (book: Book) => {
    setSelectedBook(book)
    setSelectedCopyId('')
    setCreateError(null)
    setCreateSuccess(null)
    try {
      setCopiesLoading(true)
      setCopiesError(null)
      const list = await getAvailableCopiesList(book.isbn)
      if (list.length === 0) {
        setCopies([])
        setCopiesError('No hay ejemplares disponibles para este ISBN')
      } else {
        setCopies(list)
      }
    } catch {
      setCopies([])
      setCopiesError('Error al consultar ejemplares disponibles')
    } finally {
      setCopiesLoading(false)
    }
  }

  // Registra el prestamo con la copia seleccionada
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCopyId) {
      setCreateError('Selecciona un ejemplar')
      return
    }
    if (!loanUserId.trim()) {
      setCreateError('ID de usuario es obligatorio')
      return
    }
    const uid = Number(loanUserId)
    const bid = Number(selectedCopyId)
    if (Number.isNaN(uid) || Number.isNaN(bid)) {
      setCreateError('IDs deben ser numéricos')
      return
    }
    try {
      setCreateLoading(true)
      setCreateError(null)
      setCreateSuccess(null)
      await createLoan({
        bookId: bid,
        userId: uid,
        loanDate: new Date().toISOString(),
      })
      setCreateSuccess(`Préstamo registrado: usuario ${uid} - ejemplar ${bid}`)
      setCopies((prev) => prev.filter((c) => c !== bid))
      setSelectedCopyId('')
      if (selectedBook) {
        setAvailabilityByIsbn((prev) => ({
          ...prev,
          [selectedBook.isbn]: Math.max(0, (prev[selectedBook.isbn] ?? 1) - 1),
        }))
      }
    } catch {
      setCreateError('Error al registrar el préstamo')
    } finally {
      setCreateLoading(false)
    }
  }

  // Cierra el modal con Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) closeModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isModalOpen, createLoading])

  const displayedBooks = getDisplayedBooks()

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h2>Gestión de Préstamos</h2>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          Register Loan
        </button>
      </div>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Search Loans</h3>
        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="search-userId">userId</label>
            <input
              id="search-userId"
              className="input-field"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              placeholder="Ej: 1"
              inputMode="numeric"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="search-bookId">bookId</label>
            <input
              id="search-bookId"
              className="input-field"
              value={searchBookId}
              onChange={(e) => setSearchBookId(e.target.value)}
              placeholder="Ej: 2"
              inputMode="numeric"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={searchLoading}>
            {searchLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {searchLoading && <p>Cargando préstamos...</p>}
        {searchError && (
          <p role="alert" style={{ color: 'var(--danger-color)' }}>
            {searchError}
          </p>
        )}

        {hasSearched && !searchLoading && !searchError && loans.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem' }}>ID</th>
                  <th style={{ padding: '0.75rem' }}>userId</th>
                  <th style={{ padding: '0.75rem' }}>bookId</th>
                  <th style={{ padding: '0.75rem' }}>loanDate</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem' }}>{loan.id}</td>
                    <td style={{ padding: '0.75rem' }}>{loan.userId}</td>
                    <td style={{ padding: '0.75rem' }}>{loan.bookId}</td>
                    <td style={{ padding: '0.75rem' }}>{loan.loanDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasSearched && !searchLoading && !searchError && loans.length === 0 && (
          <p>No hay resultados.</p>
        )}
      </section>

      {isModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loan-modal-title"
          onClick={closeModal}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h3 id="loan-modal-title" style={{ margin: 0 }}>
                Register Loan
              </h3>
              <button
                type="button"
                className="btn"
                onClick={closeModal}
                aria-label="Cerrar modal"
                disabled={createLoading}
              >
                Cerrar
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="book-sort-mode">Ordenar / filtrar libros</label>
              <select
                id="book-sort-mode"
                className="input-field"
                value={bookSortMode}
                onChange={(e) => setBookSortMode(e.target.value as BookSortMode)}
              >
                <option value="isbn">By ISBN</option>
                <option value="available">Available Copies Only</option>
                <option value="alpha">Alphabetical Order</option>
              </select>
            </div>

            {booksLoading && <p>Cargando libros...</p>}

            {!booksLoading && (
              <div className="form-group">
                <label htmlFor="loan-book">Libro</label>
                <select
                  id="loan-book"
                  className="input-field"
                  value={selectedBook ? String(selectedBook.id) : ''}
                  onChange={(e) => {
                    const book = displayedBooks.find((b) => String(b.id) === e.target.value)
                    if (book) handleSelectBook(book)
                  }}
                >
                  <option value="">
                    {displayedBooks.length === 0
                      ? 'No hay libros para este filtro'
                      : 'Selecciona un libro'}
                  </option>
                  {displayedBooks.map((book) => (
                    <option key={book.id} value={String(book.id)}>
                      {book.title} — ISBN {book.isbn} (
                      {availabilityByIsbn[book.isbn] ?? 0} libres)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedBook && (
              <p style={{ marginTop: 0, fontSize: '0.875rem', opacity: 0.8 }}>
                {copiesLoading
                  ? 'Consultando ejemplares...'
                  : `${copies.length} ejemplar(es) disponible(s)`}
              </p>
            )}
            {copiesError && (
              <p role="alert" style={{ color: 'var(--danger-color)' }}>
                {copiesError}
              </p>
            )}

            <form onSubmit={handleCreateLoan} style={{ display: 'grid', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="loan-copy">Ejemplar disponible</label>
                <select
                  id="loan-copy"
                  className="input-field"
                  value={selectedCopyId}
                  onChange={(e) => setSelectedCopyId(e.target.value)}
                  disabled={copies.length === 0}
                  required
                >
                  <option value="">
                    {copies.length === 0
                      ? 'Selecciona un libro primero'
                      : 'Selecciona una copia'}
                  </option>
                  {copies.map((id) => (
                    <option key={id} value={String(id)}>
                      Copia #{id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="loan-userId">ID Usuario</label>
                <input
                  id="loan-userId"
                  className="input-field"
                  value={loanUserId}
                  onChange={(e) => setLoanUserId(e.target.value)}
                  placeholder="Ej: 1"
                  inputMode="numeric"
                  required
                />
              </div>

              {createError && (
                <p role="alert" style={{ color: 'var(--danger-color)', margin: 0 }}>
                  {createError}
                </p>
              )}
              {createSuccess && (
                <p role="status" style={{ color: 'var(--success-color)', margin: 0 }}>
                  {createSuccess}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                }}
              >
                <button
                  type="button"
                  className="btn"
                  onClick={closeModal}
                  disabled={createLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createLoading || copies.length === 0}
                >
                  {createLoading ? 'Registrando...' : 'Confirmar préstamo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoansPage
