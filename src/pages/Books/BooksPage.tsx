import { useEffect, useRef, useState } from "react";
import { Edit, Plus, Trash2, X } from "lucide-react";
import {
  createBook,
  deleteBook,
  getAvailableCopies,
  getBookCoverUrl,
  getBooks,
  updateBook,
} from "@/services/bookService";
import type { Book } from "@/types";

// Campos del formulario; edition y publicationDate se manejan como texto en los inputs
type FormData = {
  title: string;
  author: string;
  isbn: string;
  edition: string;
  publicationDate: string;
};

// Forma de un documento devuelto por la busqueda de Open Library
interface OpenLibraryDoc {
  title: string;
  author_name?: string[];
  isbn?: string[];
}

const emptyForm: FormData = {
  title: "",
  author: "",
  isbn: "",
  edition: "",
  publicationDate: "",
};

export function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // conteo de ejemplares disponibles por ISBN para el filtro rapido
  const [availabilityByIsbn, setAvailabilityByIsbn] = useState<
    Record<string, number>
  >({});
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // shared create / edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // estado del autocompletado de titulos
  const [suggestions, setSuggestions] = useState<OpenLibraryDoc[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // estado de validacion del ISBN
  const [isbnError, setIsbnError] = useState<string | null>(null);

  const debounceRef = useRef<number | undefined>(undefined);

  // portada gris de respaldo cuando Open Library no tiene imagen
  const FALLBACK_COVER =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="200"><rect width="100%" height="100%" fill="%23e2e8f0"/></svg>';

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBooks();
      setBooks(data);
      if (onlyAvailable) {
        setBooks(data.filter((book) => availabilityByIsbn[book.isbn] > 0));
      }

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

  // cancela el debounce pendiente al desmontar el componente
  useEffect(() => {
    return () => window.clearTimeout(debounceRef.current);
  }, []);

  const openCreateModal = () => {
    setEditingBook(null);
    setFormData(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  // open modal with selected book data
  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      edition: String(book.edition),
      publicationDate: book.publicationDate,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setEditingBook(null);
    setFormData(emptyForm);
    setFormError(null);
  };

  const closeModal = () => {
    if (submitting) return;
    resetModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // el ISBN solo acepta numeros y un maximo de 13 digitos
    if (name === "isbn") {
      const hasInvalid = /\D/.test(value);
      const sanitized = value.replace(/\D/g, "").slice(0, 13);
      setFormData((prev) => ({ ...prev, isbn: sanitized }));
      setIsbnError(hasInvalid ? "El ISBN solo admite numeros" : null);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // busca sugerencias en Open Library con un debounce de 400ms y minimo 3 caracteres
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, title: value }));
    setShowSuggestions(false);
    setActiveIndex(-1);

    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&fields=title,author_name,isbn`,
        );
        if (!response.ok) throw new Error("open library request failed");
        const data = (await response.json()) as { docs?: OpenLibraryDoc[] };
        setSuggestions(data.docs?.slice(0, 8) ?? []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);
  };

  // rellena los campos a partir de una sugerencia seleccionada
  const selectSuggestion = (doc: OpenLibraryDoc) => {
    const author = doc.author_name?.[0] ?? "";
    const isbn = (doc.isbn?.[0] ?? "").replace(/\D/g, "").slice(0, 13);
    setFormData((prev) => ({ ...prev, title: doc.title, author, isbn }));
    setIsbnError(null);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  // navegacion por teclado dentro del listado de sugerencias
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  // form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.title.trim() ||
      !formData.author.trim() ||
      !formData.isbn.trim() ||
      !formData.edition.trim() ||
      !formData.publicationDate.trim()
    ) {
      setFormError("Todos los campos son obligatorios");
      return;
    }

    const editionNumber = Number(formData.edition);
    if (!Number.isInteger(editionNumber) || editionNumber <= 0) {
      setFormError("La edición debe ser un número entero mayor a 0");
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (formData.publicationDate > todayStr) {
      setFormError("La fecha de publicación no puede ser futura");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      isbn: formData.isbn,
      edition: editionNumber,
      publicationDate: formData.publicationDate,
    };

    try {
      setSubmitting(true);
      setFormError(null);
      if (editingBook) {
        const updated = await updateBook(editingBook.id, payload);
        setBooks((prev) =>
          prev.map((b) => (b.id === editingBook.id ? updated : b)),
        );
      } else {
        const created = await createBook(payload);
        setBooks((prev) => [...prev, created]);
      }
      resetModal();
    } catch {
      setFormError("Error al guardar el libro");
    } finally {
      setSubmitting(false);
    }
  };

  // confirm before delete
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteBook(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setError("No se pudo eliminar el libro");
    }
  };

  // close modal with Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen, submitting]);

  // lista visible segun el filtro de disponibilidad
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
            onClick={openCreateModal}
          >
            <Plus size={18} aria-hidden />
            Create Book
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
                  <p className="card-meta">
                    Publicación: {book.publicationDate}
                  </p>
                </div>
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
                {editingBook ? "Editar libro" : "Crear libro"}
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
                <div className="autocomplete">
                  <input
                    id="book-title"
                    name="title"
                    className="input-control"
                    value={formData.title}
                    onChange={handleTitleChange}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={() =>
                      window.setTimeout(() => setShowSuggestions(false), 150)
                    }
                    placeholder="Título del libro"
                    autoFocus
                    required
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={showSuggestions}
                    aria-controls="book-title-suggestions"
                    aria-autocomplete="list"
                  />
                  {showSuggestions && (
                    <ul
                      id="book-title-suggestions"
                      className="suggestions"
                      role="listbox"
                      aria-label="Sugerencias de titulos"
                    >
                      {suggestions.length === 0 ? (
                        <li className="suggestions-empty">Sin coincidencias</li>
                      ) : (
                        suggestions.map((doc, index) => (
                          <li
                            key={`${doc.title}-${index}`}
                            id={`book-suggestion-${index}`}
                            className="suggestions-item"
                            role="option"
                            aria-selected={index === activeIndex}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => selectSuggestion(doc)}
                          >
                            <span className="suggestions-title">
                              {doc.title}
                            </span>
                            {doc.author_name?.[0] && (
                              <span className="suggestions-author">
                                {doc.author_name[0]}
                              </span>
                            )}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
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
                  placeholder="9783161484100"
                  required
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={13}
                  aria-invalid={isbnError ? true : undefined}
                  aria-describedby={isbnError ? "book-isbn-error" : undefined}
                />
                {isbnError && (
                  <p id="book-isbn-error" role="alert" className="text-danger">
                    {isbnError}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="book-edition">Edición</label>
                <input
                  id="book-edition"
                  name="edition"
                  type="number"
                  min={1}
                  step={1}
                  className="input-control"
                  value={formData.edition}
                  onChange={handleChange}
                  placeholder="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="book-publication-date">
                  Fecha de publicación
                </label>
                <input
                  id="book-publication-date"
                  name="publicationDate"
                  type="date"
                  className="input-control"
                  value={formData.publicationDate}
                  onChange={handleChange}
                  max={new Date().toISOString().slice(0, 10)}
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
                    ? "Guardando..."
                    : editingBook
                      ? "Actualizar"
                      : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BooksPage;
