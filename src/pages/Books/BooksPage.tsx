import { useEffect, useState } from 'react'
import { Edit, Plus, Trash2, X } from 'lucide-react'
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

  // shared create / edit modal state
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

  // open modal with selected book data
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

  // form submit handler
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

  // confirm before delete
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure?')) return
    try {
      await deleteBook(id)
      setBooks((prev) => prev.filter((b) => b.id !== id))
    } catch {
      setError('No se pudo eliminar el libro')
    }
  }

  // close modal with Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) closeModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isModalOpen, submitting])

  return (
    <div className="page">
      <div className="page-header">
        <h2>Gestión de Libros</h2>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} aria-hidden />
          Create Book
        </button>
      </div>

      {loading && <p className="text-muted">Cargando libros...</p>}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}

      {!loading && !error && books.length === 0 && (
        <p className="text-muted">No hay libros registrados.</p>
      )}

      {!loading && !error && books.length > 0 && (
        <div className="grid-layout">
          {books.map((book) => (
            <div key={book.id} className="card">
              <img
                className="card-media"
                src={getBookCoverUrl(book.isbn)}
                alt={`Portada de ${book.title}`}
                loading="lazy"
              />
              <h3 className="card-title">{book.title}</h3>
              <p className="card-text">{book.author}</p>
              <p className="card-meta">ISBN: {book.isbn}</p>
              <div className="card-actions">
                <button
                  type="button"
                  className="btn btn-icon"
                  onClick={() => openEditModal(book)}
                  aria-label={`Editar libro ${book.title}`}
                >
                  <Edit size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  className="btn btn-icon btn-danger"
                  onClick={() => handleDelete(book.id)}
                  aria-label={`Eliminar libro ${book.title}`}
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
            </div>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="book-modal-title">
                {editingBook ? 'Editar libro' : 'Crear libro'}
              </h3>
              <button
                type="button"
                className="btn btn-icon"
                onClick={closeModal}
                aria-label="Cerrar modal"
                disabled={submitting}
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="book-title">Título</label>
                <input
                  id="book-title"
                  name="title"
                  className="input-control"
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
                  className="input-control"
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
                  className="input-control"
                  value={formData.isbn}
                  onChange={handleChange}
                  placeholder="978-3-16-148410-0"
                  required
                />
              </div>

              {formError && (
                <p role="alert" className="text-danger">
                  {formError}
                </p>
              )}

              <div className="form-actions">
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
