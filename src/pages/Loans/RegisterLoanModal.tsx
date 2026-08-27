import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createLoan } from "@/services/loanService";
import {
  getAvailableCopies,
  getAvailableCopiesList,
  getBooks,
} from "@/services/bookService";
import { getUsers } from "@/services/userService";
import type { Book, Loan, User } from "@/types";
import { BookSortMode, parseLoanError, today } from "@/utils/loan";

interface RegisterLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (loan: Loan) => void;
}

export function RegisterLoanModal({
  isOpen,
  onClose,
  onCreated,
}: RegisterLoanModalProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [availabilityByIsbn, setAvailabilityByIsbn] = useState<
    Record<string, number>
  >({});
  const [bookSortMode, setBookSortMode] = useState<BookSortMode>("alpha");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const [copies, setCopies] = useState<number[]>([]);
  const [selectedCopyId, setSelectedCopyId] = useState("");
  const [copiesLoading, setCopiesLoading] = useState(false);
  const [copiesError, setCopiesError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [loanUserId, setLoanUserId] = useState("");
  const [loanDate, setLoanDate] = useState("");
  const [loanStatus, setLoanStatus] = useState("ACTIVE");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Carga el catalogo de libros y la cantidad de ejemplares libres por ISBN
  const loadBooksForModal = async () => {
    try {
      setBooksLoading(true);
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
      setBooks([]);
      setAvailabilityByIsbn({});
    } finally {
      setBooksLoading(false);
    }
  };

  const loadUsersForModal = async () => {
    try {
      setUsersLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSelectBook = async (book: Book) => {
    setSelectedBook(book);
    setSelectedCopyId("");
    setCreateError(null);
    setCreateSuccess(null);
    try {
      setCopiesLoading(true);
      setCopiesError(null);
      const list = await getAvailableCopiesList(book.isbn);
      if (list.length === 0) {
        setCopies([]);
        setCopiesError("No hay ejemplares disponibles para este ISBN");
      } else {
        setCopies(list);
      }
    } catch {
      setCopies([]);
      setCopiesError("Error al consultar ejemplares disponibles");
    } finally {
      setCopiesLoading(false);
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanUserId.trim()) {
      setCreateError("Selecciona un usuario");
      return;
    }
    if (!selectedCopyId) {
      setCreateError("Selecciona un ejemplar");
      return;
    }
    if (!loanDate.trim()) {
      setCreateError("La fecha del préstamo es obligatoria");
      return;
    }
    const uid = Number(loanUserId);
    const cid = Number(selectedCopyId);
    if (Number.isNaN(uid) || Number.isNaN(cid)) {
      setCreateError("IDs deben ser numéricos");
      return;
    }
    try {
      setCreateLoading(true);
      setCreateError(null);
      setCreateSuccess(null);
      const created = await createLoan({
        userId: uid,
        bookId: selectedBook ? selectedBook.id : 0,
        copyId: cid,
        loanDate: loanDate,
        returnDate: "",
        status: loanStatus,
      });
      setCreateSuccess(
        `Préstamo registrado: usuario ${uid} - ejemplar ${cid}`,
      );
      setCopies((prev) => prev.filter((c) => c !== cid));
      setSelectedCopyId("");
      if (selectedBook) {
        setAvailabilityByIsbn((prev) => ({
          ...prev,
          [selectedBook.isbn]: Math.max(0, (prev[selectedBook.isbn] ?? 1) - 1),
        }));
      }
      onCreated(created);
    } catch (err) {
      setCreateError(parseLoanError(err));
    } finally {
      setCreateLoading(false);
    }
  };

  // Aplica el filtro y orden local al selector de libros
  const getDisplayedBooks = (): Book[] => {
    let list = [...books];

    if (bookSortMode === "available") {
      list = list.filter((book) => (availabilityByIsbn[book.isbn] ?? 0) > 0);
    }

    if (bookSortMode === "isbn") {
      list.sort((a, b) => a.isbn.localeCompare(b.isbn));
    } else if (bookSortMode === "alpha") {
      list.sort((a, b) =>
        a.title.localeCompare(b.title, "es", { sensitivity: "base" }),
      );
    } else if (bookSortMode === "available") {
      list.sort((a, b) =>
        a.title.localeCompare(b.title, "es", { sensitivity: "base" }),
      );
    }

    return list;
  };

  const closeModal = () => {
    if (createLoading) return;
    onClose();
  };

  // Inicializa el estado y carga el catalogo al abrir el modal
  useEffect(() => {
    if (!isOpen) return;
    setSelectedBook(null);
    setCopies([]);
    setSelectedCopyId("");
    setCopiesError(null);
    setLoanUserId("");
    setLoanDate(today());
    setLoanStatus("ACTIVE");
    setCreateError(null);
    setCreateSuccess(null);
    setBookSortMode("alpha");
    loadBooksForModal();
    loadUsersForModal();
  }, [isOpen]);

  // Cierra el modal con la tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, createLoading]);

  if (!isOpen) return null;

  const displayedBooks = getDisplayedBooks();

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loan-modal-title"
      onClick={closeModal}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="loan-modal-title">Register Loan</h3>
          <button
            type="button"
            className="btn btn-icon"
            onClick={closeModal}
            aria-label="Cerrar modal"
            disabled={createLoading}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="book-sort-mode">Ordenar / filtrar libros</label>
          <select
            id="book-sort-mode"
            className="input-control"
            value={bookSortMode}
            onChange={(e) => setBookSortMode(e.target.value as BookSortMode)}
          >
            <option value="isbn">By ISBN</option>
            <option value="available">Available Copies Only</option>
            <option value="alpha">Alphabetical Order</option>
          </select>
        </div>

        {booksLoading && <p className="text-muted">Cargando libros...</p>}

        {!booksLoading && (
          <div className="form-group">
            <label htmlFor="loan-book">Libro</label>
            <select
              id="loan-book"
              className="input-control"
              value={selectedBook ? String(selectedBook.id) : ""}
              onChange={(e) => {
                const book = displayedBooks.find(
                  (b) => String(b.id) === e.target.value,
                );
                if (book) handleSelectBook(book);
              }}
            >
              <option value="">
                {displayedBooks.length === 0
                  ? "No hay libros para este filtro"
                  : "Selecciona un libro"}
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
          <p className="text-muted">
            {copiesLoading
              ? "Consultando ejemplares..."
              : `${copies.length} ejemplar(es) disponible(s)`}
          </p>
        )}
        {copiesError && (
          <p role="alert" className="text-danger">
            {copiesError}
          </p>
        )}

        <form className="form-stack" onSubmit={handleCreateLoan}>
          <div className="form-group">
            <label htmlFor="loan-copy">Ejemplar disponible</label>
            <select
              id="loan-copy"
              className="input-control"
              value={selectedCopyId}
              onChange={(e) => setSelectedCopyId(e.target.value)}
              disabled={copies.length === 0}
              required
            >
              <option value="">
                {copies.length === 0
                  ? "Selecciona un libro primero"
                  : "Selecciona una copia"}
              </option>
              {copies.map((id) => (
                <option key={id} value={String(id)}>
                  Copia #{id}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="loan-user">Usuario</label>
            <select
              id="loan-user"
              className="input-control"
              value={loanUserId}
              onChange={(e) => setLoanUserId(e.target.value)}
              required
            >
              <option value="">
                {usersLoading
                  ? "Cargando usuarios..."
                  : "Selecciona un usuario"}
              </option>
              {users.map((user) => (
                <option key={user.id} value={String(user.id)}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="loan-date">Fecha del préstamo</label>
            <input
              id="loan-date"
              type="date"
              className="input-control"
              value={loanDate}
              onChange={(e) => setLoanDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="loan-status">Estado</label>
            <select
              id="loan-status"
              className="input-control"
              value={loanStatus}
              onChange={(e) => setLoanStatus(e.target.value)}
              required
            >
              <option value="ACTIVE">Activo</option>
              <option value="RETURNED">Devuelto</option>
              <option value="OVERDUE">Vencido</option>
            </select>
          </div>

          {createError && (
            <p role="alert" className="text-danger">
              {createError}
            </p>
          )}
          {createSuccess && (
            <p role="status" className="text-success">
              {createSuccess}
            </p>
          )}

          <div className="form-actions">
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
              disabled={
                createLoading ||
                copies.length === 0 ||
                !loanUserId ||
                !loanDate
              }
            >
              {createLoading ? "Registrando..." : "Confirmar préstamo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterLoanModal;
