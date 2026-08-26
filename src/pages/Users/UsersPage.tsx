import { useEffect, useState } from 'react'
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

  // Estado del modal y del formulario compartido (crear / editar)
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

  // Abre el modal precargado con los datos del usuario
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

  // Valida y envia creacion o actualizacion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Nombre y email son obligatorios')
      return
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setFormError('Email no valido')
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

  // Confirma con dialogo nativo antes de eliminar
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure?')) return
    try {
      await deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch {
      setError('No se pudo eliminar el usuario')
    }
  }

  // Cierra el modal con Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) closeModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isModalOpen, submitting])

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h2>Gestión de Usuarios</h2>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          Create User
        </button>
      </div>

      {loading && <p>Cargando usuarios...</p>}
      {error && (
        <p role="alert" style={{ color: 'var(--danger-color)' }}>
          {error}
        </p>
      )}

      {!loading && !error && users.length === 0 && (
        <p>No hay usuarios registrados.</p>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="card-grid">
          {users.map((user) => (
            <article key={user.id} className="card">
              <h3 style={{ margin: '0 0 0.5rem' }}>{user.name}</h3>
              <p style={{ margin: '0 0 0.25rem', color: 'var(--text-color)' }}>
                {user.email}
              </p>
              <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', opacity: 0.7 }}>
                ID: {user.id}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openEditModal(user)}
                  aria-label={`Editar usuario ${user.name}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDelete(user.id)}
                  aria-label={`Eliminar usuario ${user.name}`}
                >
                  Delete
                </button>
              </div>
            </article>
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
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h3 id="user-modal-title" style={{ margin: 0 }}>
                {editingUser ? 'Editar usuario' : 'Crear usuario'}
              </h3>
              <button
                type="button"
                className="btn"
                onClick={closeModal}
                aria-label="Cerrar modal"
                disabled={submitting}
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="user-name">Nombre</label>
                <input
                  id="user-name"
                  name="name"
                  className="input-field"
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
                  className="input-field"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              {formError && (
                <p role="alert" style={{ color: 'var(--danger-color)', marginTop: 0 }}>
                  {formError}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  marginTop: '1rem',
                }}
              >
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
