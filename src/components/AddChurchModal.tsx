import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { z } from "zod";

const phoneMask = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const schema = z.object({
  churchName: z.string().trim().min(1, "Digite o nome da Igreja"),
  pastorName: z.string().trim().min(1, "Digite o nome do Pastor"),
  pastorPhone: z.string().trim().min(14, "Telefone inválido"),
});

export type ChurchRequest = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ChurchRequest) => void;
}

export const AddChurchModal = ({ open, onClose, onSubmit }: Props) => {
  const [churchName, setChurchName] = useState("");
  const [pastorName, setPastorName] = useState("");
  const [pastorPhone, setPastorPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ churchName, pastorName, pastorPhone });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fe[i.path[0] as string] = i.message));
      setErrors(fe);
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      onSubmit(parsed.data);
      setChurchName(""); setPastorName(""); setPastorPhone(""); setErrors({});
      setSubmitting(false);
    }, 300);
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card glow-border w-full max-w-md p-6 relative"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-display font-bold text-foreground mb-2 pr-6">
              Solicitar nova igreja
            </h2>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              Obrigado por participar desse projeto. Para adicionar um novo campo, precisamos da
              permissão do Pastor Presidente. Para isso, precisamos do contato dele.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <ModalField
                label="Nome da Igreja"
                value={churchName}
                onChange={setChurchName}
                placeholder="Ex.: Assembleia de Deus - Sede"
                error={errors.churchName}
              />
              <ModalField
                label="Nome do Pastor Presidente"
                value={pastorName}
                onChange={setPastorName}
                placeholder="Ex.: Pr. João da Silva"
                error={errors.pastorName}
              />
              <ModalField
                label="Telefone do Pastor ou superintendente da EBD"
                value={pastorPhone}
                onChange={(v) => setPastorPhone(phoneMask(v))}
                placeholder="(11) 99999-9999"
                error={errors.pastorPhone}
              />
              {/* Field Area removed as per requirements */}

              <div className="grid grid-cols-2 gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="py-2.5 rounded-xl border border-border bg-muted text-foreground font-medium text-sm hover:bg-muted/70 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalizar solicitação"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ModalField = ({ label, value, onChange, placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string;
}) => (
  <div>
    <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
    <input
      type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full px-3.5 py-2.5 rounded-lg bg-muted border-2 outline-none transition-all text-sm text-foreground placeholder:text-muted-foreground/60 ${
        error ? "border-destructive" : "border-transparent focus:border-primary"
      }`}
    />
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const ModalSelect = ({ label, value, onChange, placeholder, options, error }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  options: { value: string; label: string }[]; error?: string;
}) => (
  <div>
    <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
    <select
      value={value} onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3.5 py-2.5 rounded-lg bg-muted border-2 outline-none transition-all text-sm text-foreground ${
        error ? "border-destructive" : "border-transparent focus:border-primary"
      } ${!value ? "text-muted-foreground/60" : ""}`}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="text-foreground bg-background">{o.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);
