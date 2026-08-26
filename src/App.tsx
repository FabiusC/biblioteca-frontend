import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { BooksPage } from '@/pages/Books/BooksPage'
import { CatalogPage } from '@/pages/CatalogPage'
import { HomePage } from '@/pages/HomePage'
import { LoansPage } from '@/pages/Loans/LoansPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { UsersPage } from '@/pages/Users/UsersPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/usuarios" element={<UsersPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/libros" element={<BooksPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/prestamos" element={<LoansPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
