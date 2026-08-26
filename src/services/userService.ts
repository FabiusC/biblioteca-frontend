import { api } from './api'
import { User } from '../types'

// Obtiene todos los usuarios
export const getUsers = async () => {
  const response = await api.get<User[]>('/users')
  return response.data
}

// Crea un nuevo usuario
export const createUser = async (data: Omit<User, 'id'>) => {
  const response = await api.post<User>('/users', data)
  return response.data
}

// Actualiza un usuario existente
export const updateUser = async (id: number, data: Partial<User>) => {
  const response = await api.put<User>(`/users/${id}`, data)
  return response.data
}

// Elimina un usuario
export const deleteUser = async (id: number) => {
  await api.delete(`/users/${id}`)
}
