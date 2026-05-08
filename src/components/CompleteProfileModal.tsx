import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Loader2, Plus } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddChurchModal, type ChurchRequest } from "@/components/AddChurchModal";
import { useChurches } from "@/hooks/useChurches";

const ADD_CHURCH = "ADICIONAR IGREJA";
const OTHER_CHURCH = "OUTRO";

const phoneMask = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const schema = z.object({
  phone: z.string().trim().min(14, "Telefone inválido"),
  class_id: z.string().min(1, "Selecione sua classe"),
  church: z.string().min(1, "Selecione sua igreja"),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Aceite os termos" }) }),
  acceptUpdates: z.literal(true, { errorMap: () => ({ message: "Aceite necessário" }) }),
});

interface Props {
  open: boolean;
  userId: string;
  onCompleted: () => void;
}

export const CompleteProfileModal = ({ open, userId, onCompleted }: Props) => {
  const { churches: CHURCHES } = useChurches();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");
  const [classId, setClassId] = useState("");
  const [church, setChurch] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptUpdates, setAcceptUpdates] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [churchModalOpen, setChurchModalOpen] = useState(false);
  const [churchRequested, setChurchRequested] = useState(false);
  const [pendingChurchRequest, setPendingChurchRequest] = useState<ChurchRequest | null>(null);

  const valid =
    phone.length >= 14 && classId && church && acceptTerms && acceptUpdates;

  const handleChurchChange = (v: string) => {
    if (v === ADD_CHURCH) {
      setChurchModalOpen(true);
      return;
    }
    setChurch(v);
    if (v !== OTHER_CHURCH) {
      setChurchRequested(false);
      setPendingChurchRequest(null);
    }
  };

  const handleChurchRequestSubmit = (data: ChurchRequest) => {
    const { churchName } = data;
    const isDuplicate = CHURCHES.some(
      (c) => c.toLowerCase() === churchName.toLowerCase()
    );

    if (isDuplicate) {
      toast.error("Esta igreja já existe em nosso banco de dados.");
      return;
    }

    setChurch(OTHER_CHURCH);
    setChurchRequested(true);
    setPendingChurchRequest(data);
    setChurchModalOpen(false);
    toast.success("Solicitação enviada. Igreja aguardando adesão no banco de dados.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ phone, class_id: classId, church, acceptTerms, acceptUpdates });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fe[i.path[0] as string] = i.message));
      setErrors(fe);
      return;
    }
    setSubmitting(true);
    try {
      // Resolve church_id (or insert new church request)
      let churchId: string | null = null;
      if (church && church !== OTHER_CHURCH) {
        const { data: existing } = await supabase
          .from("churches")
          .select("id")
          .eq("name", church)
          .eq("approved", true)
          .maybeSingle();
        churchId = existing?.id ?? null;
      } else if (church === OTHER_CHURCH && pendingChurchRequest) {
        const { data: inserted, error: insErr } = await supabase
          .from("churches")
          .insert({
            name: pendingChurchRequest.churchName,
            requested: true,
            approved: false,
            requester_pastor_name: pendingChurchRequest.pastorName,
            requester_phone: pendingChurchRequest.pastorPhone.replace(/\D/g, ""),
          })
          .select("id")
          .single();
        if (insErr) throw insErr;
        churchId = inserted?.id ?? null;
      }

      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          phone: phone.replace(/\D/g, ""),
          class_id: classId,
          church_id: churchId,
        })
        .eq("id", userId);
      if (upErr) throw upErr;

      // Invalida o cache do perfil para todos os hooks que dependem dele
      await queryClient.invalidateQueries({ queryKey: ["full-profile", userId] });
      toast.success("Cadastro concluído!");
      onCompleted();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar dados");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="glass-card glow-border w-full max-w-md p-6 my-8"
            >
              <h2 className="text-lg font-display font-bold text-foreground mb-2">
                Complete seu cadastro
              </h2>
              <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                Recebemos seus dados do Google, mas ainda precisamos de algumas informações para
                concluir seu cadastro.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <ModalField
                  label="Telefone"
                  value={phone}
                  onChange={(v) => setPhone(phoneMask(v))}
                  placeholder="(11) 99999-9999"
                  error={errors.phone}
                />
                <ModalClassSelect
                  value={classId}
                  onChange={setClassId}
                  error={errors.class_id}
                />
                <ModalSearchSelect
                  label="Qual o nome da sua igreja?"
                  value={church}
                  onChange={handleChurchChange}
                  placeholder="Digite ou selecione sua igreja"
                  options={[
                    ...CHURCHES.map((c) => ({ value: c, label: c })),
                    ...(churchRequested ? [{ value: OTHER_CHURCH, label: OTHER_CHURCH }] : []),
                  ]}
                  showAddButton={!CHURCHES.some(c => c.toLowerCase() === church.toLowerCase()) && church.length > 2}
                  onAddClick={() => handleChurchChange(ADD_CHURCH)}
                  error={errors.church}
                  hint={
                    churchRequested
                      ? "Solicitação enviada. Igreja aguardando adesão no banco de dados."
                      : undefined
                  }
                />

                <ModalCheckbox
                  checked={acceptTerms}
                  onChange={setAcceptTerms}
                  error={errors.acceptTerms}
                  label={
                    <>
                      Aceito os{" "}
                      <a href="#" className="text-primary hover:underline">
                        termos de uso
                      </a>
                    </>
                  }
                />
                <ModalCheckbox
                  checked={acceptUpdates}
                  onChange={setAcceptUpdates}
                  error={errors.acceptUpdates}
                  label="Desejo receber atualizações importantes da CIMADSETA"
                />

                <button
                  type="submit"
                  disabled={!valid || submitting}
                  className="w-full py-3 mt-2 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Concluir cadastro"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddChurchModal
        open={churchModalOpen}
        onClose={() => setChurchModalOpen(false)}
        onSubmit={handleChurchRequestSubmit}
      />
    </>
  );
};

const ModalField = ({ label, value, onChange, placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string;
}) => (
  <div>
    <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
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
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none px-3.5 py-2.5 pr-9 rounded-lg bg-muted border-2 outline-none transition-all text-sm cursor-pointer ${
          error ? "border-destructive" : "border-transparent focus:border-primary"
        } ${!value ? "text-muted-foreground/60" : "text-foreground"}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-foreground bg-background">{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const ModalSearchSelect = ({ label, value, onChange, placeholder, options, error, hint, showAddButton, onAddClick }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  options: { value: string; label: string }[]; error?: string; hint?: string;
  showAddButton?: boolean; onAddClick?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  return (
    <div ref={wrapRef}>
      <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={open ? query : selectedLabel}
          onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(""); }}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 pr-9 rounded-lg bg-muted border-2 outline-none transition-all text-sm cursor-text ${
            error ? "border-destructive" : "border-transparent focus:border-primary"
          } ${!value && !open ? "text-muted-foreground/60" : "text-foreground"}`}
          autoComplete="off"
        />
        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        {open && (
          <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg bg-background border border-border shadow-lg">
            {filtered.length === 0 && !showAddButton ? null : (
              <>
                {filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => { onChange(o.value); setOpen(false); setQuery(""); }}
                    className={`w-full text-left px-3.5 py-2.5 text-sm hover:bg-muted transition-colors ${
                      o.value === value ? "bg-muted text-primary font-semibold" : "text-foreground"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
                {showAddButton && (
                  <button
                    type="button"
                    onClick={() => { onAddClick?.(); setOpen(false); }}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-primary font-bold hover:bg-primary/5 transition-colors border-t border-border flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    ADICIONAR IGREJA
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-primary mt-1">{hint}</p>}
    </div>
  );
};

const ModalCheckbox = ({ checked, onChange, label, error }: {
  checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode; error?: string;
}) => (
  <div>
    <label className="flex items-start gap-2 cursor-pointer group">
      <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
        checked ? "bg-primary border-primary" : error ? "border-destructive" : "border-border group-hover:border-primary/50"
      }`}>
        {checked && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className="text-xs text-foreground flex-1">{label}</span>
    </label>
    {error && <p className="text-xs text-destructive mt-1 ml-6">{error}</p>}
  </div>
);

const ModalClassSelect = ({ value, onChange, error }: {
  value: string; onChange: (v: string) => void; error?: string;
}) => {
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  
  useEffect(() => {
    supabase.from("classes").select("id, name").eq("active", true).order("name")
      .then(({ data }) => setClasses(data || []));
  }, []);

  return (
    <ModalSelect
      label="Qual sua classe?"
      value={value}
      onChange={onChange}
      placeholder="Selecione sua classe"
      options={classes.map(c => ({ value: c.id, label: c.name }))}
      error={error}
    />
  );
};
