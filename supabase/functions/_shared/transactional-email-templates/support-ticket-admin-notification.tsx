import * as React from "npm:react@18.3.1";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "npm:@react-email/components@0.0.22";
import type { TemplateEntry } from "./registry.ts";

const SITE_NAME = "Quiz EBD ADREC";
const PRIMARY = "#4CC9E0";
const DARK = "#05070D";
const ADMIN_URL = "https://www.quizebd.com/painel/suporte";

interface Props {
  userName?: string;
  userEmail?: string;
  category?: string;
  subject?: string;
  message?: string;
  pageUrl?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: "🐛 Bug / Erro",
  suggestion: "💡 Sugestão",
  question: "❓ Dúvida",
  other: "💬 Outro",
};

const SupportTicketAdminEmail = ({
  userName,
  userEmail,
  category,
  subject,
  message,
  pageUrl,
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Novo chamado de {userName ?? "membro"}: {subject ?? ""}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ textAlign: "center", marginBottom: "24px" }}>
          <Heading style={h1}>🎫 Novo chamado de suporte</Heading>
        </Section>

        <Text style={text}>
          Um novo chamado foi aberto no painel:
        </Text>

        <Section style={card}>
          <Text style={cardLabel}>De</Text>
          <Text style={cardValue}>
            {userName ?? "Sem nome"} {userEmail ? `· ${userEmail}` : ""}
          </Text>

          <Text style={cardLabel}>Tipo</Text>
          <Text style={cardValue}>
            {CATEGORY_LABELS[category ?? ""] ?? category ?? "—"}
          </Text>

          <Text style={cardLabel}>Assunto</Text>
          <Text style={cardValue}>{subject ?? "—"}</Text>

          {message && (
            <>
              <Text style={cardLabel}>Mensagem</Text>
              <Text style={cardMessage}>{message}</Text>
            </>
          )}

          {pageUrl && (
            <>
              <Text style={cardLabel}>Página</Text>
              <Text style={cardLink}>{pageUrl}</Text>
            </>
          )}
        </Section>

        <Section style={{ textAlign: "center", margin: "24px 0" }}>
          <Button href={ADMIN_URL} style={button}>
            Abrir no painel
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          <strong>{SITE_NAME}</strong> · Painel de Suporte
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: SupportTicketAdminEmail,
  subject: (data: Record<string, any>) =>
    `🎫 Novo chamado: ${data?.subject ?? "Suporte"}`,
  to: "marcosmmarques77@gmail.com",
  displayName: "Notificação admin · novo chamado",
  previewData: {
    userName: "Maicon Silva",
    userEmail: "maicon@example.com",
    category: "bug",
    subject: "Quiz não carrega no Safari",
    message: "Quando tento abrir o quiz no iPhone, a tela fica em branco.",
    pageUrl: "https://www.quizebd.com/quiz",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "560px", margin: "0 auto" };
const h1 = { fontSize: "22px", fontWeight: "bold", color: DARK, margin: "0" };
const text = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  margin: "0 0 16px",
};
const card = {
  backgroundColor: "#F1F8FA",
  border: `1px solid ${PRIMARY}33`,
  borderRadius: "12px",
  padding: "20px",
  margin: "20px 0",
};
const cardLabel = {
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  color: "#6B7280",
  margin: "12px 0 4px",
  fontWeight: "bold" as const,
};
const cardValue = {
  fontSize: "15px",
  color: DARK,
  margin: "0",
  fontWeight: "600" as const,
};
const cardMessage = {
  fontSize: "14px",
  color: "#374151",
  margin: "0",
  lineHeight: "1.5",
  whiteSpace: "pre-wrap" as const,
};
const cardLink = {
  fontSize: "13px",
  color: PRIMARY,
  margin: "0",
  wordBreak: "break-all" as const,
};
const button = {
  backgroundColor: PRIMARY,
  color: "#ffffff",
  padding: "12px 28px",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: "bold",
  textDecoration: "none",
  display: "inline-block",
};
const hr = { borderColor: "#E5E7EB", margin: "32px 0 20px" };
const footer = {
  fontSize: "12px",
  color: "#9CA3AF",
  textAlign: "center" as const,
  margin: "0",
};
