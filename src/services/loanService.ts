import { api } from './api'
import { Loan } from '../types'

// Crea un nuevo prestamo
export const createLoan = async (data: Omit<Loan, 'id'>) => {
  const response = await api.post<Loan>('/loans', data)
  return response.data
}

// Actualiza un prestamo existente (por ejemplo, para registrar una devolucion)
export const updateLoan = async (id: number, data: Partial<Loan>) => {
  const response = await api.put<Loan>(`/loans/${id}`, data)
  return response.data
}

// Busca prestamos por usuario y/o libro de forma combinada
export const searchLoans = async (userId?: number, bookId?: number) => {
  const params = new URLSearchParams()
  if (userId !== undefined) params.append('userId', String(userId))
  if (bookId !== undefined) params.append('bookId', String(bookId))
  const query = params.toString()
  const response = await api.get<Loan[]>(
    `/loans/search${query ? `?${query}` : ''}`,
  )
  return response.data
}

// Lista los prestamos asociados a un usuario
export const getLoansByUser = async (userId: number) => {
  const response = await api.get<Loan[]>(`/loans/user/${userId}`)
  return response.data
}

// Lista los prestamos asociados a un libro
export const getLoansByBook = async (bookId: number) => {
  const response = await api.get<Loan[]>(`/loans/book/${bookId}`)
  return response.data
}
