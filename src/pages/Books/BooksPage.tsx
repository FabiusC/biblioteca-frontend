import { useEffect, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import {
  deleteBook,
  getAvailableCopies,
  getBookCoverUrl,
  getBooks,
} from "@/services/bookService";
import type { Book } from "@/types";
import { BookFormModal } from "./BookFormModal";

// Portada gris de respaldo cuando Open Library no tiene imagen
const FALLBACK_COVER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="200"><rect width="100%" height="100%" fill="%23e2e8f0"/></svg>';

export function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Conteo de ejemplares disponibles por ISBN para el filtro rapido
  const [availabilityByIsbn, setAvailabilityByIsbn] = useState<
    Record<string, number>
  >({});
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Modal de creacion / edicion
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBooks();
      setBooks(data);

      const pairs = await Promise.all(
        data.map(async (book) => {
          try {
            const count = await getAvailableCopies(book.isbn);
            return [book.isbn, count] as const;
          } catch {
            return [book.isbn, 0] as const;
          }
        }),
      );
      setAvailabilityByIsbn(Object.fromEntries(pairs));
    } catch {
      setError("No se pudo cargar la lista de libros");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleBookSaved = (book: Book) => {
    setBooks((prev) =>
      editingBook
        ? prev.map((b) => (b.id === book.id ? book : b))
        : [...prev, book],
    );
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteBook(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setError("No se pudo eliminar el libro");
    }
  };

  // Lista visible segun el filtro de disponibilidad
  const visibleBooks = onlyAvailable
    ? books.filter((book) => (availabilityByIsbn[book.isbn] ?? 0) > 0)
    : books;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Gestión de Libros</h2>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn"
            onClick={() => setOnlyAvailable((prev) => !prev)}
            aria-pressed={onlyAvailable}
          >
            {onlyAvailable ? "Limpiar filtro" : "Ver libros disponibles"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditingBook(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} aria-hidden />
            Crear Libro
          </button>
        </div>
      </div>

      {loading && <p className="text-muted">Cargando libros...</p>}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}

      {!loading && !error && visibleBooks.length === 0 && (
        <p className="text-muted">
          {onlyAvailable
            ? "No hay libros disponibles."
            : "No hay libros registrados."}
        </p>
      )}

      {!loading && !error && visibleBooks.length > 0 && (
        <div className="grid-layout">
          {visibleBooks.map((book) => (
            <div key={book.id} className="card card-horizontal">
              <img
                className="card-media"
                src={getBookCoverUrl(book.isbn)}
                alt={`Portada de ${book.title}`}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_COVER;
                }}
              />
              <div className="card-content-flex">
                <div>
                  <h3 className="card-title">{book.title}</h3>
                  <p className="card-text">{book.author}</p>
                  <p className="card-meta">ISBN: {book.isbn}</p>
                  <p className="card-meta">Edición: {book.edition}</p>
                  <p className="card-meta">Publicación: {book.publicationDate}</p>
                </div>
                <div className="card-actions">
                  <button
                    type="button"
                    className="btn btn-icon"
                    onClick={() => {
                      setEditingBook(book);
                      setIsModalOpen(true);
                    }}
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
            </div>
          ))}
        </div>
      )}

      <BookFormModal
        isOpen={isModalOpen}
        editingBook={editingBook}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBook(null);
        }}
        onSaved={handleBookSaved}
      />
    </div>
  );
}

export default BooksPage;
