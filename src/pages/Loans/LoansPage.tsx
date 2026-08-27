import { useState } from "react";
import { Plus } from "lucide-react";
import type { Loan } from "@/types";
import { LoanSearchSection } from "./LoanSearchSection";
import { RegisterLoanModal } from "./RegisterLoanModal";
import { EditLoanModal } from "./EditLoanModal";

export function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  const openEditModal = (loan: Loan) => {
    setEditingLoan(loan);
    setIsEditOpen(true);
  };

  const handleLoanCreated = (loan: Loan) => {
    setLoans((prev) => [...prev, loan]);
  };

  const handleLoanUpdated = (updated: Loan) => {
    setLoans((prev) =>
      prev.map((loan) => (loan.id === updated.id ? updated : loan)),
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Gestión de Préstamos</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsRegisterOpen(true)}
        >
          <Plus size={18} aria-hidden />
          Registrar Préstamo 
        </button>
      </div>

      <LoanSearchSection
        loans={loans}
        setLoans={setLoans}
        onEditLoan={openEditModal}
      />

      <RegisterLoanModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onCreated={handleLoanCreated}
      />

      <EditLoanModal
        loan={isEditOpen ? editingLoan : null}
        onClose={() => {
          setIsEditOpen(false);
          setEditingLoan(null);
        }}
        onUpdated={handleLoanUpdated}
      />
    </div>
  );
}

export default LoansPage;
