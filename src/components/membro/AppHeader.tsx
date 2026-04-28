import { ArrowLeft, Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import churchLogo from "@/assets/church-logo.webp";
import { useFullProfile } from "@/hooks/useFullProfile";
import { useSidebar } from "@/components/ui/sidebar";

interface BaseProps {
  /** Subtítulo opcional exibido abaixo do título (modo back) */
  subtitle?: string;
  /** Ações extras à direita */
  rightSlot?: ReactNode;
  /** Esconde a borda inferior */
  borderless?: boolean;
}

interface FullHeaderProps extends BaseProps {
  variant?: "full";
  /** Nome do usuário (primeira letra vira o avatar) */
  firstName?: string;
  /** Mostra o sino (atalho histórico) */
  showBell?: boolean;
  /** Custom click no sino */
  onBellClick?: () => void;
  /** Custom click no avatar */
  onAvatarClick?: () => void;
  title?: never;
  onBack?: never;
  backTo?: never;
}

interface BackHeaderProps extends BaseProps {
  variant: "back";
  title: string;
  /** Para onde voltar (default: navigate(-1)) */
  backTo?: string;
  /** Override completo do clique de voltar */
  onBack?: () => void;
  firstName?: never;
  showBell?: never;
  onBellClick?: never;
  onAvatarClick?: never;
}

type Props = FullHeaderProps | BackHeaderProps;

/**
 * Header app-like reutilizável.
 *
 * - `variant="full"`: logo + branding + (sino) + avatar (igual home)
 * - `variant="back"`: botão voltar + título centralizado (estilo iOS)
 *
 * Sempre sticky no topo, com `safe-area-inset-top` e blur de fundo.
 * No desktop fica escondido (o MemberLayout exibe o header próprio).
 */
export function AppHeader(props: Props) {
  const navigate = useNavigate();
  const { data: profile } = useFullProfile();
  const { toggleSidebar } = useSidebar();
  const userChurch = profile?.church_name?.trim();

  const handleBack = () => {
    if (props.variant !== "back") return;
    if (props.onBack) return props.onBack();
    if (props.backTo) return navigate(props.backTo);
    navigate(-1);
  };

  return (
    <header
      className={`md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-xl ${
        props.borderless ? "" : "border-b border-border/50"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between px-4 h-14 gap-2">
        {props.variant === "back" ? (
          <>
            <button
              onClick={handleBack}
              aria-label="Voltar"
              className="w-10 h-10 -ml-2 rounded-full hover:bg-muted flex items-center justify-center text-foreground active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0 text-center">
              <h1 className="text-base font-bold text-foreground truncate leading-tight">
                {props.title}
              </h1>
              {props.subtitle && (
                <p className="text-[10px] text-muted-foreground truncate leading-tight">
                  {props.subtitle}
                </p>
              )}
            </div>
            <div className="w-10 flex items-center justify-end">
              {props.rightSlot}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                <img
                  src={churchLogo}
                  alt="ADREC"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div className="leading-tight min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  EBD Online
                </div>
                <div className="text-xs font-semibold text-foreground truncate">
                  CIMADSETA · {userChurch || "ADREC"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {props.rightSlot}
              {props.showBell !== false && (
                <button
                  aria-label="Notificações"
                  onClick={
                    props.onBellClick ?? (() => navigate("/membro/historico"))
                  }
                  className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                >
                  <Bell className="w-5 h-5" />
                </button>
              )}
              <button
                aria-label="Perfil"
                onClick={
                  props.onAvatarClick ?? (() => navigate("/membro/perfil"))
                }
                className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md active:scale-95 transition-transform"
              >
                {(props.firstName ?? "?").charAt(0).toUpperCase()}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
