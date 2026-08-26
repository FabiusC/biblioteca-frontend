import { api } from './api'
import { Book } from '../types'

// Obtiene todos los libros
export const getBooks = async () => {
  const response = await api.get<Book[]>('/books')
  return response.data
}

// Crea un nuevo libro
export const createBook = async (data: Omit<Book, 'id'>) => {
  const response = await api.post<Book>('/books', data)
  return response.data
}

// Actualiza un libro existente
export const updateBook = async (id: number, data: Partial<Book>) => {
  const response = await api.put<Book>(`/books/${id}`, data)
  return response.data
}

// Elimina un libro
export const deleteBook = async (id: number) => {
  await api.delete(`/books/${id}`)
}

// Obtiene el numero de copias disponibles para un ISBN especifico
export const getAvailableCopies = async (isbn: string) => {
  const response = await api.get<{ count: number }>(`/books/availability/${isbn}`)
  return response.data.count
}

// Obtiene los IDs de ejemplares libres por ISBN, soporta respuesta count o lista
export const getAvailableCopiesList = async (isbn: string): Promise<number[]> => {
  const response = await api.get<unknown>(`/books/availability/${isbn}`)
  const data = response.data as Record<string, unknown>
  // si es array directo
  if (Array.isArray(data)) return data as number[]
  // si tiene copies como array de ids u objetos
  if (Array.isArray(data.copies)) {
    return (data.copies as Array<number | { id: number }>).map((c) => (typeof c === 'number' ? c : c.id))
  }
  // si tiene count genera ids secuenciales 1..count (fallback)
  if (typeof data.count === 'number') {
    return Array.from({ length: data.count }, (_, i) => i + 1)
  }
  // si tiene availableCopies o similar
  if (Array.isArray(data.availableCopies)) {
    return (data.availableCopies as Array<number | { id: number }>).map((c) => (typeof c === 'number' ? c : c.id))
  }
  return []
}

// Funcion auxiliar pura para obtener la URL de la portada del libro
export const getBookCoverUrl = (isbn: string): string => {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
}
