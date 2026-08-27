import { useEffect, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { deleteUser, getUsers } from "@/services/userService";
import type { User } from "@/types";
import { UserFormModal } from "./UserFormModal";

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de creacion / edicion
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setUsers(data);
    } catch {
      setError("No se pudo cargar la lista de usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserSaved = (user: User) => {
    setUsers((prev) =>
      editingUser
        ? prev.map((u) => (u.id === user.id ? user : u))
        : [...prev, user],
    );
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setError("No se pudo eliminar el usuario");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Gestión de Usuarios</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditingUser(null);
            setIsModalOpen(true);
          }}
        >
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
              <h3 className="card-title">
                {user.firstName} {user.lastName}
              </h3>
              <p className="card-text">{user.email}</p>
              <p className="card-meta">Nacimiento: {user.birthDate}</p>
              <p className="card-meta">ID: {user.id}</p>
              <div className="card-actions">
                <button
                  type="button"
                  className="btn btn-icon"
                  onClick={() => {
                    setEditingUser(user);
                    setIsModalOpen(true);
                  }}
                  aria-label={`Editar usuario ${user.firstName} ${user.lastName}`}
                >
                  <Edit size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  className="btn btn-icon btn-danger"
                  onClick={() => handleDelete(user.id)}
                  aria-label={`Eliminar usuario ${user.firstName} ${user.lastName}`}
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <UserFormModal
        isOpen={isModalOpen}
        editingUser={editingUser}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSaved={handleUserSaved}
      />
    </div>
  );
}

export default UsersPage;
