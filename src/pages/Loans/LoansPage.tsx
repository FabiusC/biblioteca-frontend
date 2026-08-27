import { useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import {
  createLoan,
  getLoansByBook,
  getLoansByUser,
  searchLoans,
  updateLoan,
} from "@/services/loanService";
import {
  getAvailableCopies,
  getAvailableCopiesList,
  getBooks,
} from "@/services/bookService";
import { getUsers } from "@/services/userService";
import type { Book, Loan, User } from "@/types";

// book list sort / filter modes
type BookSortMode = "isbn" | "available" | "alpha";

// Extrae un mensaje claro del error devuelto por el backend
const parseLoanError = (err: unknown): string => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;

  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string") {
      if (/already has active loans/i.test(message)) {
        return "El usuario ya tiene un préstamo activo.";
      } else if (/overdue loans/i.test(message))
        return "El usuario tiene un préstamo vencido.";
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return "Error al registrar el préstamo";
};

export function LoansPage() {
  // loan search state
  const [searchUserId, setSearchUserId] = useState("");
  const [searchBookId, setSearchBookId] = useState("");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // catalogo para los selectores de busqueda
  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const [searchBooks, setSearchBooks] = useState<Book[]>([]);
  const [searchUsersLoading, setSearchUsersLoading] = useState(false);
  const [searchBooksLoading, setSearchBooksLoading] = useState(false);
  const [searchBookSort, setSearchBookSort] = useState<"isbn" | "alpha">(
    "alpha",
  );

  // register loan modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const [loanUserId, setLoanUserId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // modal de edicion / devolucion de prestamo
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editReturnDate, setEditReturnDate] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // catalogo de usuarios para el selector de prestamos
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // fecha del prestamo (por defecto hoy) y estado
  const [loanDate, setLoanDate] = useState("");
  const [loanStatus, setLoanStatus] = useState("ACTIVE");

  const today = () => new Date().toISOString().slice(0, 10);

  // carga usuarios y libros para los selectores de busqueda
  const loadSearchCatalog = async () => {
    try {
      setSearchUsersLoading(true);
      setSearchBooksLoading(true);
      const [usersData, booksData] = await Promise.all([
        getUsers(),
        getBooks(),
      ]);
      setSearchUsers(usersData);
      setSearchBooks(booksData);
    } catch {
      setSearchUsers([]);
      setSearchBooks([]);
    } finally {
      setSearchUsersLoading(false);
      setSearchBooksLoading(false);
    }
  };

  useEffect(() => {
    loadSearchCatalog();
  }, []);

  // search loans routing to the right endpoint per selected filters
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = searchUserId ? Number(searchUserId) : undefined;
    const bid = searchBookId ? Number(searchBookId) : undefined;

    if (uid === undefined && bid === undefined) {
      setSearchError("Selecciona un usuario o un libro para buscar");
      return;
    }
    if (uid !== undefined && Number.isNaN(uid)) {
      setSearchError("El ID de usuario no es válido");
      return;
    }
    if (bid !== undefined && Number.isNaN(bid)) {
      setSearchError("El ID de libro no es válido");
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      setHasSearched(true);

      let data: Loan[] = [];
      if (uid !== undefined && bid !== undefined) {
        data = await searchLoans(uid, bid);
      } else if (uid !== undefined) {
        data = await getLoansByUser(uid);
      } else if (bid !== undefined) {
        data = await getLoansByBook(bid);
      }

      if (!data || data.length === 0) {
        setLoans([]);
        setSearchError("No se encontraron préstamos");
      } else {
        setLoans(data);
      }
    } catch {
      setLoans([]);
      setSearchError("Error al buscar préstamos");
    } finally {
      setSearchLoading(false);
    }
  };

  // ordena el catalogo de libros para el selector de busqueda
  const getSearchDisplayedBooks = (): Book[] => {
    const list = [...searchBooks];
    if (searchBookSort === "isbn") {
      list.sort((a, b) => a.isbn.localeCompare(b.isbn));
    } else {
      list.sort((a, b) =>
        a.title.localeCompare(b.title, "es", { sensitivity: "base" }),
      );
    }
    return list;
  };

  // cruza el id de usuario con el catalogo cargado para mostrar datos legibles
  const resolveUser = (userId: number): User | undefined =>
    searchUsers.find((user) => user.id === userId);

  // cruza el id de libro con el catalogo cargado para mostrar datos legibles
  const resolveBook = (bookId: number): Book | undefined =>
    searchBooks.find((book) => book.id === bookId);

  // load catalog and free-copy counts for the modal
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

  const openCreateModal = () => {
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
    setIsModalOpen(true);
    loadBooksForModal();
    loadUsersForModal();
  };

  // carga la lista de usuarios para el selector
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

  const resetModal = () => {
    setIsModalOpen(false);
    setSelectedBook(null);
    setCopies([]);
    setSelectedCopyId("");
    setCopiesError(null);
    setLoanUserId("");
    setLoanDate("");
    setLoanStatus("ACTIVE");
    setCreateError(null);
    setCreateSuccess(null);
  };

  const closeModal = () => {
    if (createLoading) return;
    resetModal();
  };

  // abre el modal de edicion / devolucion precargado con el prestamo
  const openEditModal = (loan: Loan) => {
    setEditingLoan(loan);
    setEditStatus(loan.status);
    setEditReturnDate(loan.status === "RETURNED" ? loan.returnDate : today());
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (editLoading) return;
    setIsEditModalOpen(false);
    setEditingLoan(null);
  };

  // registra la devolucion o actualiza el estado del prestamo
  const handleUpdateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoan) return;

    const payload: Partial<Loan> = {
      status: editStatus,
      returnDate: editStatus === "RETURNED" ? editReturnDate : "",
    };

    try {
      setEditLoading(true);
      setEditError(null);
      const updated = await updateLoan(editingLoan.id, payload);
      setLoans((prev) =>
        prev.map((loan) => (loan.id === editingLoan.id ? updated : loan)),
      );
      setIsEditModalOpen(false);
      setEditingLoan(null);
    } catch (err) {
      setEditError(parseLoanError(err));
    } finally {
      setEditLoading(false);
    }
  };

  // apply local filter and sort for the book selector
  const getDisplayedBooks = (): Book[] => {
    let list = [...books];

    if (bookSortMode === "available") {
      // keep only books with at least one free copy
      list = list.filter((book) => (availabilityByIsbn[book.isbn] ?? 0) > 0);
    }

    if (bookSortMode === "isbn") {
      // sort by ISBN string
      list.sort((a, b) => a.isbn.localeCompare(b.isbn));
    } else if (bookSortMode === "alpha") {
      // alphabetical by title
      list.sort((a, b) =>
        a.title.localeCompare(b.title, "es", { sensitivity: "base" }),
      );
    } else if (bookSortMode === "available") {
      // after filtering, sort by title for stable reading
      list.sort((a, b) =>
        a.title.localeCompare(b.title, "es", { sensitivity: "base" }),
      );
    }

    return list;
  };

  // load available copy ids when a book is selected
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

  // register loan with selected copy
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
      await createLoan({
        userId: uid,
        bookId: selectedBook ? selectedBook.id : 0,
        copyId: cid,
        loanDate: loanDate,
        returnDate: "",
        status: loanStatus,
      });
      setCreateSuccess(`Préstamo registrado: usuario ${uid} - ejemplar ${cid}`);
      setCopies((prev) => prev.filter((c) => c !== cid));
      setSelectedCopyId("");
      if (selectedBook) {
        setAvailabilityByIsbn((prev) => ({
          ...prev,
          [selectedBook.isbn]: Math.max(0, (prev[selectedBook.isbn] ?? 1) - 1),
        }));
      }
    } catch (err) {
      setCreateError(parseLoanError(err));
    } finally {
      setCreateLoading(false);
    }
  };

  // close modal with Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen, createLoading]);

  // close edit modal with Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isEditModalOpen) closeEditModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEditModalOpen, editLoading]);

  const displayedBooks = getDisplayedBooks();

  return (
    <div className="page">
      <div className="page-header">
        <h2>Gestión de Préstamos</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          <Plus size={18} aria-hidden />
          Register Loan
        </button>
      </div>

      <section className="card">
        <h3 className="card-title">Buscar Préstamos</h3>
        <form className="form-row" onSubmit={handleSearch}>
          <div className="form-group">
            <label htmlFor="search-userId">Buscar por Usuario</label>
            <select
              id="search-userId"
              className="input-control"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
            >
              <option value="">
                {searchUsersLoading
                  ? "Cargando usuarios..."
                  : "Selecciona un usuario"}
              </option>
              {searchUsers.map((user) => (
                <option key={user.id} value={String(user.id)}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="search-bookId">Buscar por Libro</label>
            <select
              id="search-bookId"
              className="input-control"
              value={searchBookId}
              onChange={(e) => setSearchBookId(e.target.value)}
            >
              <option value="">
                {searchBooksLoading
                  ? "Cargando libros..."
                  : "Selecciona un libro"}
              </option>
              {getSearchDisplayedBooks().map((book) => (
                <option key={book.id} value={String(book.id)}>
                  {book.title} — ISBN {book.isbn}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="search-book-sort">Ordenar libros</label>
            <select
              id="search-book-sort"
              className="input-control"
              value={searchBookSort}
              onChange={(e) =>
                setSearchBookSort(e.target.value as "isbn" | "alpha")
              }
            >
              <option value="alpha">Alfabético (título)</option>
              <option value="isbn">Por ISBN</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={searchLoading}
          >
            <Search size={18} aria-hidden />
            {searchLoading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {searchLoading && <p className="text-muted">Cargando préstamos...</p>}
        {searchError && (
          <p role="alert" className="text-danger">
            {searchError}
          </p>
        )}

        {hasSearched && !searchLoading && !searchError && loans.length > 0 && (
          <div className="grid-layout">
            {loans.map((loan) => {
              const user = resolveUser(loan.userId);
              const book = resolveBook(loan.bookId);
              return (
                <div
                  key={loan.id}
                  className={`card${loan.status === "ACTIVE" ? " card-active" : ""}`}
                >
                  <h3 className="card-title">Préstamo #{loan.id}</h3>
                  <p className="card-text">
                    Usuario:{" "}
                    {user
                      ? `${user.firstName} ${user.lastName} (ID: ${loan.userId})`
                      : `ID: ${loan.userId}`}
                  </p>
                  {user && <p className="card-meta">{user.email}</p>}
                  <p className="card-text">
                    Libro: {book ? book.title : "Desconocido"} - Copia #
                    {loan.copyId}
                    {book ? ` (ISBN: ${book.isbn})` : ""}
                  </p>
                  <p className="card-meta">Fecha: {loan.loanDate}</p>
                  <p className="card-meta">
                    Estado:{" "}
                    <span
                      className={`loan-status loan-status--${loan.status.toLowerCase()}`}
                    >
                      {loan.status}
                    </span>
                  </p>
                  {loan.status !== "RETURNED" && (
                    <div className="card-actions">
                      <button
                        type="button"
                        className="btn"
                        onClick={() => openEditModal(loan)}
                        aria-label={`Registrar devolución del préstamo ${loan.id}`}
                      >
                        Editar / Devolver
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {hasSearched &&
          !searchLoading &&
          !searchError &&
          loans.length === 0 && (
            <p className="text-muted">No hay resultados.</p>
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
                onChange={(e) =>
                  setBookSortMode(e.target.value as BookSortMode)
                }
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
      )}

      {isEditModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loan-edit-title"
          onClick={closeEditModal}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="loan-edit-title">Editar préstamo</h3>
              <button
                type="button"
                className="btn btn-icon"
                onClick={closeEditModal}
                aria-label="Cerrar modal"
                disabled={editLoading}
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            <form className="form-stack" onSubmit={handleUpdateLoan}>
              <div className="form-group">
                <label htmlFor="loan-edit-status">Estado</label>
                <select
                  id="loan-edit-status"
                  className="input-control"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  required
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="RETURNED">Devuelto</option>
                  <option value="OVERDUE">Vencido</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="loan-edit-return-date">
                  Fecha de devolución
                </label>
                <input
                  id="loan-edit-return-date"
                  type="date"
                  className="input-control"
                  value={editReturnDate}
                  onChange={(e) => setEditReturnDate(e.target.value)}
                  disabled={editStatus !== "RETURNED"}
                  required={editStatus === "RETURNED"}
                />
              </div>

              {editError && (
                <p role="alert" className="text-danger">
                  {editError}
                </p>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={closeEditModal}
                  disabled={editLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoansPage;
