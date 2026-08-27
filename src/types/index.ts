// Definiciones de tipos para las entidades del sistema

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  edition: number;
  publicationDate: string;
}

export interface Loan {
  id: number;
  userId: number;
  bookId: number;
  copyId: number;
  loanDate: string;
  returnDate: string;
  status: string;
}
