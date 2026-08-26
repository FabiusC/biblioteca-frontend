import { api } from './api'
import { Loan } from '../types'

// Crea un nuevo prestamo
export const createLoan = async (data: Omit<Loan, 'id'>) => {
  const response = await api.post<Loan>('/loans', data)
  return response.data
}

// Busca prestamos por userId y bookId
export const searchLoans = async (userId: number, bookId: number) => {
  const response = await api.get<Loan[]>(`/loans?userId=${userId}&bookId=${bookId}`)
  return response.data
}