import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { getLoansByBook, getLoansByUser, searchLoans } from "@/services/loanService";
import { getBooks } from "@/services/bookService";
import { getUsers } from "@/services/userService";
import type { Book, Loan, User } from "@/types";

interface LoanSearchSectionProps {
  loans: Loan[];
  setLoans: React.Dispatch<React.SetStateAction<Loan[]>>;
  onEditLoan: (loan: Loan) => void;
}

export function LoanSearchSection({
  loans,
  setLoans,
  onEditLoan,
}: LoanSearchSectionProps) {
  const [searchUserId, setSearchUserId] = useState("");
  const [searchBookId, setSearchBookId] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const [searchBooks, setSearchBooks] = useState<Book[]>([]);
  const [searchUsersLoading, setSearchUsersLoading] = useState(false);
  const [searchBooksLoading, setSearchBooksLoading] = useState(false);
  const [searchBookSort, setSearchBookSort] = useState<"isbn" | "alpha">(
    "alpha",
  );

  // Carga usuarios y libros para los selectores de busqueda
  useEffect(() => {
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
    loadSearchCatalog();
  }, []);

  // Enruta la busqueda al endpoint adecuado segun los filtros seleccionados
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

  // Ordena el catalogo de libros para el selector de busqueda
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

  const resolveUser = (userId: number): User | undefined =>
    searchUsers.find((user) => user.id === userId);

  const resolveBook = (bookId: number): Book | undefined =>
    searchBooks.find((book) => book.id === bookId);

  return (
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
                      onClick={() => onEditLoan(loan)}
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

      {hasSearched && !searchLoading && !searchError && loans.length === 0 && (
        <p className="text-muted">No hay resultados.</p>
      )}
    </section>
  );
}

export default LoanSearchSection;
