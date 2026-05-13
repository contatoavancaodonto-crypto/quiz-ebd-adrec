import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { Eye, EyeOff, Check, Loader2, ChevronDown, Plus, User, Church, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AddChurchModal, type ChurchRequest } from "@/components/AddChurchModal";
import { useChurches } from "@/hooks/useChurches";
import { toast } from "sonner";
import churchLogo from "@/assets/church-logo.webp";

const ADD_CHURCH = "CADASTRAR IGREJA";
const OTHER_CHURCH = "OUTRO";
const INDIVIDUAL = "INDIVIDUAL";
// AREAS is no longer used, replaced by classes from DB

type Mode = "login" | "signup";

const phoneMask = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const detectIdentifier = (v: string) => (/^[\d\s()-]+$/.test(v) ? "phone" : "email");

const passwordStrength = (pwd: string): { score: 0 | 1 | 2 | 3 | 4; label: string } => {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return { score: s as 0 | 1 | 2 | 3 | 4, label: ["Fraca", "Fraca", "Média", "Forte", "Muito Forte"][s] };
};

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Campo obrigatório"),
  password: z.string().min(8, "Senha precisa ter pelo menos 8 caracteres"),
});

const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, "Digite seu nome").max(50),
    lastName: z.string().trim().min(1, "Digite seu sobrenome").max(50),
    class_id: z.string().uuid("Selecione uma classe válida"),
    church: z.string().min(1, "Selecione sua igreja"),
    phone: z.string().trim().min(14, "Telefone inválido"),
    email: z.string().trim().email("Digite um email válido").max(255).or(z.literal("")),
    password: z.string().min(8, "Senha precisa ter pelo menos 8 caracteres"),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "Você precisa aceitar os termos para continuar" }) }),
    acceptUpdates: z.literal(true, { errorMap: () => ({ message: "É necessário aceitar para prosseguir" }) }),
  });

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { churches: CHURCHES } = useChurches();
  const [mode, setMode] = useState<Mode>("login");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Login fields
  const [identifier, setIdentifier] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const [lastLoginMethod, setLastLoginMethod] = useState<string | null>(null);
  const [keepLoggedIn, setKeepLoggedIn] = useState(() => {
    const v = localStorage.getItem("keepLoggedIn");
    return v === null ? true : v === "true";
  });

  useEffect(() => {
    const saved = localStorage.getItem("last_login_method");
    const savedIdentifier = localStorage.getItem("last_login_identifier");
    if (saved) setLastLoginMethod(saved);
    if (savedIdentifier) setIdentifier(savedIdentifier);
  }, []);

  // Signup fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [church, setChurch] = useState("");
  const [churchModalOpen, setChurchModalOpen] = useState(false);
  const [churchRequested, setChurchRequested] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState(""); // Removed as requested
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptUpdates, setAcceptUpdates] = useState(false);

  const handleChurchChange = (v: string) => {
    if (v === ADD_CHURCH) {
      setChurchModalOpen(true);
      return;
    }
    setChurch(v);
    if (v !== INDIVIDUAL) {
      const isApproved = CHURCHES.some(c => c === v);
      if (isApproved) setChurchRequested(false);
    } else {
      setChurchRequested(false);
    }
  };

  const handleChurchRequestSubmit = async (data: ChurchRequest) => {
    const { churchName, pastorName, pastorPhone } = data;
    const isDuplicate = CHURCHES.some(
      (c) => c.toLowerCase() === churchName.toLowerCase()
    );

    if (isDuplicate) {
      toast.error("Esta igreja já existe em nosso banco de dados.");
      return;
    }

    try {
      const { error } = await supabase.from("churches").insert({
        name: churchName,
        pastor_president: pastorName,
        requester_phone: pastorPhone.replace(/\D/g, ""),
        approved: false,
        active: true,
        requested: true,
      });

      if (error) throw error;

      setChurch(churchName);
      setChurchRequested(true);
      setChurchModalOpen(false);
      toast.success("Solicitação enviada! Ela aparecerá após aprovação.");
    } catch (error: any) {
      console.error("Erro ao solicitar igreja:", error);
      toast.error("Erro ao enviar solicitação.");
    }
  };

  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
    
    // Fetch classes
    supabase.from("classes").select("id, name").eq("active", true).order("name")
      .then(({ data }) => setClasses(data || []));
  }, [user, authLoading, navigate]);

  const handleGoogle = async () => {
    setSubmitting(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Erro ao entrar com Google");
      setSubmitting(false);
    } else {
      localStorage.setItem("last_login_method", "google");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = loginSchema.safeParse({ identifier, password: loginPwd });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fe[i.path[0] as string] = i.message));
      setErrors(fe);
      return;
    }
    setSubmitting(true);
    localStorage.setItem("keepLoggedIn", String(keepLoggedIn));
    
    // Se não quiser manter conectado, usamos sessionStorage (temporário)
    // O cliente Supabase usa localStorage por padrão no integrations/supabase/client.ts
    // Podemos trocar dinamicamente o storage ou apenas aceitar o padrão do cliente
    // que já está configurado para persistir.
    
    const loginType = detectIdentifier(identifier);
    const isEmail = loginType === "email";
    const { error } = isEmail
      ? await supabase.auth.signInWithPassword({ email: identifier.trim(), password: loginPwd })
      : await supabase.auth.signInWithPassword({ phone: identifier.replace(/\D/g, ""), password: loginPwd });
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("Invalid") ? "Email/telefone ou senha incorretos" : error.message);
      return;
    }
    localStorage.setItem("last_login_method", loginType);
    localStorage.setItem("last_login_identifier", identifier);
    toast.success("Bem-vindo de volta!");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = signupSchema.safeParse({
      firstName, lastName, class_id: classId, church, phone, email, password, acceptTerms, acceptUpdates,
    });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fe[i.path[0] as string] = i.message));
      setErrors(fe);
      return;
    }
    setSubmitting(true);
    const method = email.trim() ? "email" : "phone";
    const { error } = await supabase.auth.signUp({
      email: email.trim() || `${phone.replace(/\D/g, "")}@quiz-ebd.local`,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: firstName.trim(), last_name: lastName.trim(),
          phone: phone.replace(/\D/g, ""), class_id: classId, church,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      console.error("Erro no signup:", error);
      toast.error(error.message.includes("already") ? "Este email já está cadastrado" : error.message);
      return;
    }
    
    // Auto-login after signup to ensure smooth transition
    const loginType = email.trim() ? "email" : "phone";
    const identifier = email.trim() || `${phone.replace(/\D/g, "")}@quiz-ebd.local`;
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: password,
    });

    if (signInError) {
      console.error("Erro no auto-login após signup:", signInError);
      toast.info("Conta criada! Por favor, faça login.");
      setMode("login");
    } else {
      localStorage.setItem("last_login_method", method);
      localStorage.setItem("last_login_identifier", email.trim() || phone.replace(/\D/g, ""));
      toast.success("Conta criada! Bem-vindo!");
      navigate("/", { replace: true });
    }
  };

  const pwdStrength = passwordStrength(password);
  const signupValid =
    firstName && lastName && classId && church && phone.length >= 14 && password.length >= 8 &&
    acceptTerms && acceptUpdates;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <ThemeToggle />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-background mb-3">
            <img src={churchLogo} alt="ADREC" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-2xl font-display font-bold gradient-text">Quiz EBD online</h1>
          <p className="text-sm text-muted-foreground">CIMADSETA</p>
        </div>

        <div className="glass-card glow-border p-6">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl mb-5">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErrors({}); }}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {/* Google */}
          <div className="relative">
            <button
              onClick={handleGoogle}
              disabled={submitting}
              className="w-full py-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 font-medium text-sm disabled:opacity-50"
            >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
              Continuar com Google
            </button>
            {lastLoginMethod === "google" && mode === "login" && (
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-in fade-in zoom-in">
                Último uso
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou continue com email/telefone</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form
                key="login" onSubmit={handleLogin}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <Field
                  label={detectIdentifier(identifier) === "email" ? "Seu e-mail" : "Telefone"} 
                  autoFocus value={identifier}
                  onChange={(v) => setIdentifier(detectIdentifier(v) === "phone" ? phoneMask(v) : v)}
                  placeholder="seu@email.com ou (11) 99999-9999"
                  error={errors.identifier}
                  showLastUse={lastLoginMethod === "email" || lastLoginMethod === "phone"}
                />
                <PasswordField
                  label="Senha" value={loginPwd} onChange={setLoginPwd}
                  show={showPwd} toggle={() => setShowPwd(!showPwd)} error={errors.password}
                />
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                  />
                  Manter conectado
                </label>
                <button 
                  type="button" 
                  className="text-xs text-primary hover:underline" 
                  onClick={async () => {
                    if (!identifier) {
                      toast.error("Por favor, digite seu e-mail ou telefone acima para recuperar a senha.");
                      return;
                    }
                    
                    const loginType = detectIdentifier(identifier);
                    if (loginType !== "email") {
                      toast.info("A recuperação automática de senha via telefone ainda não está disponível. Por favor, entre em contato com o suporte.");
                      return;
                    }

                    try {
                      setSubmitting(true);
                      const { error } = await supabase.auth.resetPasswordForEmail(identifier.trim(), {
                        redirectTo: window.location.origin + "/auth/reset-password",
                      });
                      
                      if (error) throw error;
                      toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
                    } catch (error: any) {
                      toast.error("Erro ao enviar e-mail: " + error.message);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                >
                  Esqueci minha senha
                </button>
                <SubmitButton submitting={submitting} disabled={false}>Acessar minha conta</SubmitButton>
              </motion.form>
            ) : (
              <motion.form
                key="signup" onSubmit={handleSignup}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nome" value={firstName} onChange={setFirstName} placeholder="João" error={errors.firstName} />
                  <Field label="Sobrenome" value={lastName} onChange={setLastName} placeholder="Silva" error={errors.lastName} />
                </div>

                <Select
                  label="Qual sua classe?" value={classId} onChange={setClassId}
                  placeholder="Selecione sua classe" error={errors.class_id}
                  options={classes.map((c) => ({ value: c.id, label: c.name }))}
                />
                <SearchableSelect
                  label="Qual o nome da sua igreja?" value={church} onChange={handleChurchChange}
                  placeholder="Digite ou selecione sua igreja" error={errors.church}
                  options={[
                    { value: INDIVIDUAL, label: INDIVIDUAL },
                    ...CHURCHES.map((c) => ({ value: c, label: c })),
                    ...(churchRequested ? [{ value: church, label: church }] : []),
                  ]}
                  showAddButton={!CHURCHES.some(c => c.toLowerCase() === church.toLowerCase()) && church.length > 2 && church !== INDIVIDUAL && !churchRequested}
                  onAddClick={() => handleChurchChange(ADD_CHURCH)}
                  hint={churchRequested ? "Solicitação enviada. Igreja aguardando adesão no banco de dados." : undefined}
                />
                <Field
                  label="Telefone" value={phone} onChange={(v) => setPhone(phoneMask(v))}
                  placeholder="(11) 99999-9999" error={errors.phone}
                  success={phone.length >= 14}
                />
                <Field
                  label="Email (opcional)" type="email" value={email} onChange={setEmail}
                  placeholder="seu@email.com" error={errors.email}
                />
                <PasswordField
                  label="Senha" value={password} onChange={setPassword}
                  show={showPwd} toggle={() => setShowPwd(!showPwd)} error={errors.password}
                />
                {password && (
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        i < pwdStrength.score
                          ? pwdStrength.score <= 2 ? "bg-destructive" : pwdStrength.score === 3 ? "bg-primary/70" : "bg-primary"
                          : "bg-muted"
                      }`} />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-1">{pwdStrength.label}</span>
                  </div>
                )}
                {/* confirmPassword field removed */}

                <Checkbox
                  checked={acceptTerms} onChange={setAcceptTerms} error={errors.acceptTerms}
                  label={<>Aceito os <a href="#" className="text-primary hover:underline">termos de uso</a></>}
                />
                <Checkbox
                  checked={acceptUpdates} onChange={setAcceptUpdates} error={errors.acceptUpdates}
                  label="Desejo receber atualizações importantes do QUIZ EBD"
                  hint="Enviamos apenas comunicações relevantes"
                />

                <SubmitButton submitting={submitting} disabled={!signupValid}>Criar conta e começar</SubmitButton>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AddChurchModal
        open={churchModalOpen}
        onClose={() => setChurchModalOpen(false)}
        onSubmit={handleChurchRequestSubmit}
      />
    </div>
  );
};

const Select = ({ label, value, onChange, placeholder, options, error, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  options: { value: string; label: string }[]; error?: string; hint?: string;
}) => (
  <div>
    <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
    <div className="relative">
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
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
    {hint && !error && <p className="text-xs text-primary mt-1">{hint}</p>}
  </div>
);

const SearchableSelect = ({ label, value, onChange, placeholder, options, error, hint, showAddButton, onAddClick }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  options: { value: string; label: string }[]; error?: string; hint?: string;
  showAddButton?: boolean; onAddClick?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    const isExactMatchInOptions = options.some(o => o.label.toLowerCase() === q);
    
    let result = options.filter((o) => o.label.toLowerCase().includes(q));
    
    // Se não houver match exato e não estiver na lista filtrada, 
    // e o usuário digitou algo substancial, poderíamos adicionar um feedback visual
    return result;
  }, [options, query]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  return (
    <div ref={wrapRef}>
      <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={open ? query : selectedLabel}
          onChange={(e) => { 
            const val = e.target.value;
            setQuery(val); 
            if (!open) setOpen(true);
            // If the user is typing, we might want to update the parent state if they just stop there
            // but usually we wait for a selection. However, the requirement says "when user starts writing"
            // we show the option. The parent already controls showAddButton via the 'church' state.
            // So we should sync query to parent if we want it to react.
            onChange(val);
          }}
          onFocus={() => { setOpen(true); setQuery(""); }}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 pr-9 rounded-lg bg-muted border-2 outline-none transition-all text-sm cursor-text ${
            error ? "border-destructive" : "border-transparent focus:border-primary"
          } ${!value && !open ? "text-muted-foreground/60" : "text-foreground"}`}
          autoComplete="off"
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
        {open && (
          <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg bg-background border border-border shadow-lg">
            {filtered.length === 0 && !showAddButton ? (
              <div className="px-3.5 py-2.5 text-sm text-muted-foreground">Nenhuma igreja encontrada</div>
            ) : (
              <>
                {filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => { onChange(o.value); setOpen(false); setQuery(""); }}
                    className={`w-full text-left px-3.5 py-2.5 text-sm hover:bg-muted transition-colors ${
                      o.value === value ? "bg-muted text-primary font-semibold" : "text-foreground"
                    } ${o.value === INDIVIDUAL ? "border-b border-border font-medium bg-primary/5" : ""}`}
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
                    CADASTRAR IGREJA
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

const LastUseBadge = () => (
  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-in fade-in zoom-in ml-2">
    Último uso
  </span>
);

const Field = ({ label, value, onChange, placeholder, error, success, type = "text", autoFocus, showLastUse }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  error?: string; success?: boolean; type?: string; autoFocus?: boolean;
  showLastUse?: boolean;
}) => (
  <div>
    <label className="flex items-center text-xs font-medium text-foreground mb-1.5">
      {label}
      {showLastUse && <LastUseBadge />}
    </label>
    <div className="relative">
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoFocus={autoFocus}
        className={`w-full px-3.5 py-2.5 rounded-lg bg-muted border-2 outline-none transition-all text-sm text-foreground placeholder:text-muted-foreground/60 ${
          error ? "border-destructive focus:border-destructive" : "border-transparent focus:border-primary"
        }`}
      />
      {success && !error && (
        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
      )}
    </div>
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const PasswordField = ({ label, value, onChange, show, toggle, error, success }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; toggle: () => void; error?: string; success?: boolean;
}) => (
  <div>
    <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        className={`w-full px-3.5 py-2.5 pr-10 rounded-lg bg-muted border-2 outline-none transition-all text-sm text-foreground ${
          error ? "border-destructive" : "border-transparent focus:border-primary"
        }`}
      />
      <button type="button" onClick={toggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      {success && !error && (
        <Check className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
      )}
    </div>
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const Checkbox = ({ checked, onChange, label, hint, error }: {
  checked: boolean; onChange: (v: boolean) => void;
  label: React.ReactNode; hint?: string; error?: string;
}) => (
  <div>
    <label className="flex items-start gap-2 cursor-pointer group">
      <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
        checked ? "bg-primary border-primary" : error ? "border-destructive" : "border-border group-hover:border-primary/50"
      }`}>
        {checked && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <div className="flex-1">
        <span className="text-xs text-foreground">{label}</span>
        {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
    </label>
    {error && <p className="text-xs text-destructive mt-1 ml-6">{error}</p>}
  </div>
);

const SubmitButton = ({ submitting, disabled, children }: {
  submitting: boolean; disabled: boolean; children: React.ReactNode;
}) => (
  <button
    type="submit" disabled={submitting || disabled}
    className="w-full py-3 mt-2 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
  </button>
);

export default Auth;
