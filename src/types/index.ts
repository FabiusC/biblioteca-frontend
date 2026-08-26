// Definiciones de tipos para las entidades del sistema

export interface User {
  id: number
  name: string
  email: string
}

export interface Book {
  id: number
  title: string
  author: string
  isbn: string
}

export interface Loan {
  id: number
  bookId: number
  userId: number
  loanDate: string
}
