import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createUser, updateUser } from "@/services/userService";
import type { User } from "@/types";

// Campos del formulario; excluye el id generado por el backend
type FormData = Omit<User, "id">;

const emptyForm: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  birthDate: "",
};

interface UserFormModalProps {
  isOpen: boolean;
  editingUser: User | null;
  onClose: () => void;
  onSaved: (user: User) => void;
}

// Modal de creacion y edicion de usuarios.
// Centraliza las validaciones de negocio y la carga de datos del formulario.
export function UserFormModal({
  isOpen,
  editingUser,
  onClose,
  onSaved,
}: UserFormModalProps) {
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Inicializa el formulario al abrir, segun sea creacion o edicion
  useEffect(() => {
    if (!isOpen) return;
    if (editingUser) {
      setFormData({
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        birthDate: editingUser.birthDate,
      });
    } else {
      setFormData(emptyForm);
    }
    setFormError(null);
  }, [isOpen, editingUser]);

  const closeModal = () => {
    if (submitting) return;
    onClose();
  };

  // Cierra el modal con la tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, submitting]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.birthDate.trim()
    ) {
      setFormError(
        "Nombre, apellido, email y fecha de nacimiento son obligatorios",
      );
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setFormError("Email no válido");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const saved = editingUser
        ? await updateUser(editingUser.id, formData)
        : await createUser(formData);
      onSaved(saved);
      onClose();
    } catch {
      setFormError("Error al guardar el usuario");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
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
            {editingUser ? "Editar usuario" : "Crear usuario"}
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
            <label htmlFor="user-first-name">Nombre</label>
            <input
              id="user-first-name"
              name="firstName"
              className="input-control"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Nombre"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-last-name">Apellido</label>
            <input
              id="user-last-name"
              name="lastName"
              className="input-control"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Apellido"
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

          <div className="form-group">
            <label htmlFor="user-birth-date">Fecha de nacimiento</label>
            <input
              id="user-birth-date"
              name="birthDate"
              type="date"
              className="input-control"
              value={formData.birthDate}
              onChange={handleChange}
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
              {submitting ? "Guardando..." : editingUser ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;
