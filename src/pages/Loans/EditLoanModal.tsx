import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { updateLoan } from "@/services/loanService";
import type { Loan } from "@/types";
import { parseLoanError, today } from "@/utils/loan";

interface EditLoanModalProps {
  loan: Loan | null;
  onClose: () => void;
  onUpdated: (loan: Loan) => void;
}

export function EditLoanModal({ loan, onClose, onUpdated }: EditLoanModalProps) {
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editReturnDate, setEditReturnDate] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Precargar el formulario con los datos del prestamo a editar
  useEffect(() => {
    if (!loan) return;
    setEditStatus(loan.status);
    setEditReturnDate(loan.status === "RETURNED" ? loan.returnDate : today());
    setEditError(null);
  }, [loan]);

  const closeModal = () => {
    if (editLoading) return;
    onClose();
  };

  const handleUpdateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;

    const payload: Partial<Loan> = {
      status: editStatus,
      returnDate: editStatus === "RETURNED" ? editReturnDate : "",
    };

    try {
      setEditLoading(true);
      setEditError(null);
      const updated = await updateLoan(loan.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setEditError(parseLoanError(err));
    } finally {
      setEditLoading(false);
    }
  };

  // Cierra el modal con la tecla Escape
  useEffect(() => {
    if (!loan) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loan, editLoading]);

  if (!loan) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loan-edit-title"
      onClick={closeModal}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="loan-edit-title">Editar préstamo</h3>
          <button
            type="button"
            className="btn btn-icon"
            onClick={closeModal}
            aria-label="Cerrar modal"
            disabled={editLoading}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <form className="form-stack" onSubmit={handleUpdateLoan}>
          <div className="form-group">
            <label htmlFor="loan-edit-status">Estado</label>
            <select
              id="loan-edit-status"
              className="input-control"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              required
            >
              <option value="ACTIVE">Activo</option>
              <option value="RETURNED">Devuelto</option>
              <option value="OVERDUE">Vencido</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="loan-edit-return-date">Fecha de devolución</label>
            <input
              id="loan-edit-return-date"
              type="date"
              className="input-control"
              value={editReturnDate}
              onChange={(e) => setEditReturnDate(e.target.value)}
              disabled={editStatus !== "RETURNED"}
              required={editStatus === "RETURNED"}
            />
          </div>

          {editError && (
            <p role="alert" className="text-danger">
              {editError}
            </p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn"
              onClick={closeModal}
              disabled={editLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={editLoading}
            >
              {editLoading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditLoanModal;
