import { useEffect, useState } from 'react'
import {
  createBook,
  deleteBook,
  getBookCoverUrl,
  getBooks,
  updateBook,
} from '@/services/bookService'
import type { Book } from '@/types'

type FormData = Omit<Book, 'id'>

const emptyForm: FormData = { title: '', author: '', isbn: '' }

export function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado del modal y del formulario compartido (crear / editar)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchBooks = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getBooks()
      setBooks(data)
    } catch {
      setError('No se pudo cargar la lista de libros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const openCreateModal = () => {
    setEditingBook(null)
    setFormData(emptyForm)
    setFormError(null)
    setIsModalOpen(true)
  }

  // Abre el modal precargado con los datos del libro
  const openEditModal = (book: Book) => {
    setEditingBook(book)
    setFormData({ title: book.title, author: book.author, isbn: book.isbn })
    setFormError(null)
    setIsModalOpen(true)
  }

  const resetModal = () => {
    setIsModalOpen(false)
    setEditingBook(null)
    setFormData(emptyForm)
    setFormError(null)
  }

  const closeModal = () => {
    if (submitting) return
    resetModal()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Valida y envia creacion o actualizacion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.author.trim() || !formData.isbn.trim()) {
      setFormError('Todos los campos son obligatorios')
      return
    }

    try {
      setSubmitting(true)
      setFormError(null)
      if (editingBook) {
        const updated = await updateBook(editingBook.id, formData)
        setBooks((prev) =>
          prev.map((b) => (b.id === editingBook.id ? updated : b)),
        )
      } else {
        const created = await createBook(formData)
        setBooks((prev) => [...prev, created])
      }
      resetModal()
    } catch {
      setFormError('Error al guardar el libro')
    } finally {
      setSubmitting(false)
    }
  }

  // Confirma con dialogo nativo antes de eliminar
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure?')) return
    try {
      await deleteBook(id)
      setBooks((prev) => prev.filter((b) => b.id !== id))
    } catch {
      setError('No se pudo eliminar el libro')
    }
  }

  // Cierra el modal con Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) closeModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isModalOpen, submitting])

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
        <h2>Gestión de Libros</h2>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          Create Book
        </button>
      </div>

      {loading && <p>Cargando libros...</p>}
      {error && (
        <p role="alert" style={{ color: 'var(--danger-color)' }}>
          {error}
        </p>
      )}

      {!loading && !error && books.length === 0 && (
        <p>No hay libros registrados.</p>
      )}

      {!loading && !error && books.length > 0 && (
        <div className="card-grid">
          {books.map((book) => (
            <article key={book.id} className="card">
              <img
                src={getBookCoverUrl(book.isbn)}
                alt={`Portada de ${book.title}`}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '0.375rem',
                  marginBottom: '0.75rem',
                  background: 'var(--border-color)',
                }}
              />
              <h3 style={{ margin: '0 0 0.5rem' }}>{book.title}</h3>
              <p style={{ margin: '0 0 0.25rem', color: 'var(--text-color)' }}>
                {book.author}
              </p>
              <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', opacity: 0.7 }}>
                ISBN: {book.isbn}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openEditModal(book)}
                  aria-label={`Editar libro ${book.title}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDelete(book.id)}
                  aria-label={`Eliminar libro ${book.title}`}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-modal-title"
          onClick={closeModal}
        >
          <div
            className="modal-content"
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
              <h3 id="book-modal-title" style={{ margin: 0 }}>
                {editingBook ? 'Editar libro' : 'Crear libro'}
              </h3>
              <button
                type="button"
                className="btn"
                onClick={closeModal}
                aria-label="Cerrar modal"
                disabled={submitting}
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="book-title">Título</label>
                <input
                  id="book-title"
                  name="title"
                  className="input-field"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Título del libro"
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="book-author">Autor</label>
                <input
                  id="book-author"
                  name="author"
                  className="input-field"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Autor"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="book-isbn">ISBN</label>
                <input
                  id="book-isbn"
                  name="isbn"
                  className="input-field"
                  value={formData.isbn}
                  onChange={handleChange}
                  placeholder="978-3-16-148410-0"
                  required
                />
              </div>

              {formError && (
                <p role="alert" style={{ color: 'var(--danger-color)', marginTop: 0 }}>
                  {formError}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  marginTop: '1rem',
                }}
              >
                <button
                  type="button"
                  className="btn"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? 'Guardando...'
                    : editingBook
                      ? 'Actualizar'
                      : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BooksPage
