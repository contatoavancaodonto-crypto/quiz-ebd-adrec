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

interface Props {
  name?: string;
  className?: string;
  trimester?: number;
  year?: number;
  title?: string;
  fileUrl?: string;
}

const NewClassMaterialEmail = ({
  name,
  className,
  trimester,
  year,
  title,
  fileUrl,
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>📖 Nova revista disponível: {title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>📖 Nova Revista Disponível!</Heading>
        </Section>

        <Text style={text}>
          Olá {name ?? "irmão(ã)"}, paz do Senhor! 🙏
        </Text>

        <Text style={text}>
          A revista do <strong>{trimester}º trimestre de {year}</strong> da
          classe <strong>{className}</strong> já está disponível para download.
        </Text>

        <Section style={card}>
          <Text style={cardTitle}>{title}</Text>
          <Text style={cardSubtitle}>
            {className} · {trimester}º TRI {year}
          </Text>
        </Section>

        {fileUrl && (
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button href={fileUrl} style={button}>
              📥 Baixar Revista
            </Button>
          </Section>
        )}

        <Hr style={hr} />

        <Text style={footer}>
          Estude, prepare-se e participe do próximo Quiz EBD! 🏆
          <br />
          <strong>{SITE_NAME}</strong>
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: NewClassMaterialEmail,
  subject: (data: Record<string, any>) =>
    `📖 Nova revista: ${data?.title ?? "Revista da Classe"}`,
  displayName: "Nova revista da classe",
  previewData: {
    name: "Maicon",
    className: "Adultos",
    trimester: 1,
    year: 2026,
    title: "Revista 1º TRI 2026",
    fileUrl: "https://example.com/revista.pdf",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "560px", margin: "0 auto" };
const header = { textAlign: "center" as const, marginBottom: "24px" };
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
  textAlign: "center" as const,
};
const cardTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: DARK,
  margin: "0 0 6px",
};
const cardSubtitle = { fontSize: "13px", color: "#6B7280", margin: "0" };
const button = {
  backgroundColor: PRIMARY,
  color: "#ffffff",
  padding: "14px 32px",
  borderRadius: "10px",
  fontSize: "16px",
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
  lineHeight: "1.6",
};
