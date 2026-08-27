import { api } from "./api";
import { Book } from "../types";

// Obtiene todos los libros
export const getBooks = async () => {
  const response = await api.get<Book[]>("/books");
  return response.data;
};

// Crea un nuevo libro
export const createBook = async (data: Omit<Book, "id">) => {
  const response = await api.post<Book>("/books", data);
  return response.data;
};

// Actualiza un libro existente
export const updateBook = async (id: number, data: Partial<Book>) => {
  const response = await api.put<Book>(`/books/${id}`, data)
  return response.data
};

// Busca un libro por su id
export const getBookById = async (id: number) => {
  const response = await api.get<Book>(`/books/${id}`)
  return response.data
};

// Elimina un libro
export const deleteBook = async (id: number) => {
  await api.delete(`/books/${id}`);
};

// Obtiene los IDs de ejemplares disponibles para un ISBN especifico
export const getAvailableCopiesList = async (
  isbn: string,
): Promise<number[]> => {
  const response = await api.get<unknown>(
    `/books/${isbn}/available-copies`,
  );
  const data = response.data as Record<string, unknown> | unknown[];

  // respuesta como arreglo directo de ids u objetos con id
  if (Array.isArray(data)) {
    return data.map((c) =>
      typeof c === "number" ? c : (c as { id: number }).id,
    );
  }
  // respuesta envuelta en un objeto con la propiedad copies
  if (Array.isArray((data as Record<string, unknown>).copies)) {
    return (
      (data as Record<string, unknown>).copies as Array<number | { id: number }>
    ).map((c) => (typeof c === "number" ? c : c.id));
  }
  return [];
};

// Obtiene el numero de copias disponibles para un ISBN especifico
export const getAvailableCopies = async (isbn: string) => {
  const copies = await getAvailableCopiesList(isbn);
  return copies.length;
};

// Funcion auxiliar pura para obtener la URL de la portada del libro
export const getBookCoverUrl = (isbn: string): string => {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
};
