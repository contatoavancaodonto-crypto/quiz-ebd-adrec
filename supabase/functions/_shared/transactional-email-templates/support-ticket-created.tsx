import * as React from "npm:react@18.3.1";
import {
  Body,
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

interface Props {
  name?: string;
  category?: string;
  subject?: string;
  message?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug / Erro",
  suggestion: "Sugestão",
  question: "Dúvida",
  other: "Outro",
};

const SupportTicketCreatedEmail = ({ name, category, subject, message }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Recebemos seu chamado: {subject ?? "Suporte"}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ textAlign: "center", marginBottom: "24px" }}>
          <Heading style={h1}>✅ Chamado recebido!</Heading>
        </Section>

        <Text style={text}>Olá {name ?? "irmão(ã)"}, paz do Senhor! 🙏</Text>

        <Text style={text}>
          Recebemos seu chamado e nossa equipe vai analisá-lo o quanto antes.
          Você será notificado por aqui assim que houver uma resposta.
        </Text>

        <Section style={card}>
          <Text style={cardLabel}>Tipo</Text>
          <Text style={cardValue}>
            {CATEGORY_LABELS[category ?? ""] ?? category ?? "Chamado"}
          </Text>

          <Text style={cardLabel}>Assunto</Text>
          <Text style={cardValue}>{subject ?? "—"}</Text>

          {message && (
            <>
              <Text style={cardLabel}>Mensagem</Text>
              <Text style={cardMessage}>{message}</Text>
            </>
          )}
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Obrigado por nos ajudar a melhorar! 💙
          <br />
          <strong>{SITE_NAME}</strong>
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: SupportTicketCreatedEmail,
  subject: (data: Record<string, any>) =>
    `✅ Recebemos seu chamado: ${data?.subject ?? "Suporte"}`,
  displayName: "Confirmação de chamado de suporte",
  previewData: {
    name: "Maicon",
    category: "question",
    subject: "Como funciona o ranking?",
    message: "Gostaria de entender como o ranking semanal é calculado.",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "560px", margin: "0 auto" };
const h1 = { fontSize: "24px", fontWeight: "bold", color: DARK, margin: "0" };
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
const hr = { borderColor: "#E5E7EB", margin: "32px 0 20px" };
const footer = {
  fontSize: "12px",
  color: "#9CA3AF",
  textAlign: "center" as const,
  margin: "0",
  lineHeight: "1.6",
};
