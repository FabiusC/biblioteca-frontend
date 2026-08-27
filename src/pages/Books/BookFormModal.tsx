import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createBook, updateBook } from "@/services/bookService";
import type { Book } from "@/types";
import { BookSearchInput, type OpenLibraryDoc } from "./BookSearchInput";

// Campos del formulario; edition y publicationDate se manejan como texto en los inputs
type FormData = {
  title: string;
  author: string;
  isbn: string;
  edition: string;
  publicationDate: string;
};

const emptyForm: FormData = {
  title: "",
  author: "",
  isbn: "",
  edition: "",
  publicationDate: "",
};

interface BookFormModalProps {
  isOpen: boolean;
  editingBook: Book | null;
  onClose: () => void;
  onSaved: (book: Book) => void;
}

// Modal de creacion y edicion de libros.
// Centraliza las validaciones de negocio y la carga de datos del formulario.
export function BookFormModal({
  isOpen,
  editingBook,
  onClose,
  onSaved,
}: BookFormModalProps) {
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isbnError, setIsbnError] = useState<string | null>(null);

  // Inicializa el formulario al abrir, segun sea creacion o edicion
  useEffect(() => {
    if (!isOpen) return;
    if (editingBook) {
      setFormData({
        title: editingBook.title,
        author: editingBook.author,
        isbn: editingBook.isbn,
        edition: String(editingBook.edition),
        publicationDate: editingBook.publicationDate,
      });
    } else {
      setFormData(emptyForm);
    }
    setFormError(null);
    setIsbnError(null);
  }, [isOpen, editingBook]);

  const closeModal = () => {
    if (submitting) return;
    onClose();
  };

  // Cierra el modal con la tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, submitting]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // El ISBN solo acepta numeros y un maximo de 13 digitos
    if (name === "isbn") {
      const hasInvalid = /\D/.test(value);
      const sanitized = value.replace(/\D/g, "").slice(0, 13);
      setFormData((prev) => ({ ...prev, isbn: sanitized }));
      setIsbnError(hasInvalid ? "El ISBN solo admite numeros" : null);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, title: value }));
  };

  // Rellena los campos a partir de una sugerencia seleccionada
  const handleSelectSuggestion = (doc: OpenLibraryDoc) => {
    const author = doc.author_name?.[0] ?? "";
    const isbn = (doc.isbn?.[0] ?? "").replace(/\D/g, "").slice(0, 13);
    setFormData((prev) => ({ ...prev, title: doc.title, author, isbn }));
    setIsbnError(null);
  };

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
      const saved = editingBook
        ? await updateBook(editingBook.id, payload)
        : await createBook(payload);
      onSaved(saved);
      onClose();
    } catch {
      setFormError("Error al guardar el libro");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
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
            <BookSearchInput
              id="book-title"
              value={formData.title}
              onChange={handleTitleChange}
              onSelect={handleSelectSuggestion}
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
              placeholder="9783161484100"
              required
              inputMode="numeric"
              pattern="\d*"
              maxLength={13}
              aria-invalid={isbnError ? true : undefined}
              aria-describedby={isbnError ? "book-isbn-error" : undefined}
            />
            {isbnError && (
              <p
                id="book-isbn-error"
                role="alert"
                className="text-danger"
              >
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
  );
}

export default BookFormModal;
