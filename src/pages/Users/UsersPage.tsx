import { useEffect, useState } from 'react'
import { Edit, Plus, Trash2, X } from 'lucide-react'
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from '@/services/userService'
import type { User } from '@/types'

type FormData = Omit<User, 'id'>

const emptyForm: FormData = { name: '', email: '' }

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // shared create / edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUsers()
      setUsers(data)
    } catch {
      setError('No se pudo cargar la lista de usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData(emptyForm)
    setFormError(null)
    setIsModalOpen(true)
  }

  // open modal with selected user data
  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({ name: user.name, email: user.email })
    setFormError(null)
    setIsModalOpen(true)
  }

  const resetModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
    setFormData(emptyForm)
    setFormError(null)
  }

  const closeModal = () => {
    if (submitting) return
    resetModal()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Nombre y email son obligatorios')
      return
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setFormError('Email no válido')
      return
    }

    try {
      setSubmitting(true)
      setFormError(null)
      if (editingUser) {
        const updated = await updateUser(editingUser.id, formData)
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? updated : u)),
        )
      } else {
        const created = await createUser(formData)
        setUsers((prev) => [...prev, created])
      }
      resetModal()
    } catch {
      setFormError('Error al guardar el usuario')
    } finally {
      setSubmitting(false)
    }
  }

  // confirm before delete
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure?')) return
    try {
      await deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch {
      setError('No se pudo eliminar el usuario')
    }
  }

  // close modal with Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) closeModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isModalOpen, submitting])

  return (
    <div className="page">
      <div className="page-header">
        <h2>Gestión de Usuarios</h2>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} aria-hidden />
          Create User
        </button>
      </div>

      {loading && <p className="text-muted">Cargando usuarios...</p>}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}

      {!loading && !error && users.length === 0 && (
        <p className="text-muted">No hay usuarios registrados.</p>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="grid-layout">
          {users.map((user) => (
            <div key={user.id} className="card">
              <h3 className="card-title">{user.name}</h3>
              <p className="card-text">{user.email}</p>
              <p className="card-meta">ID: {user.id}</p>
              <div className="card-actions">
                <button
                  type="button"
                  className="btn btn-icon"
                  onClick={() => openEditModal(user)}
                  aria-label={`Editar usuario ${user.name}`}
                >
                  <Edit size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  className="btn btn-icon btn-danger"
                  onClick={() => handleDelete(user.id)}
                  aria-label={`Eliminar usuario ${user.name}`}
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-modal-title"
          onClick={closeModal}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="user-modal-title">
                {editingUser ? 'Editar usuario' : 'Crear usuario'}
              </h3>
              <button
                type="button"
                className="btn btn-icon"
                onClick={closeModal}
                aria-label="Cerrar modal"
                disabled={submitting}
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="user-name">Nombre</label>
                <input
                  id="user-name"
                  name="name"
                  className="input-control"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nombre completo"
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="user-email">Email</label>
                <input
                  id="user-email"
                  name="email"
                  type="email"
                  className="input-control"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              {formError && (
                <p role="alert" className="text-danger">
                  {formError}
                </p>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? 'Guardando...'
                    : editingUser
                      ? 'Actualizar'
                      : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
