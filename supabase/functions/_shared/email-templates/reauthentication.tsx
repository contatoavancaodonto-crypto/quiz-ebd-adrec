/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props { token: string }

export const ReauthenticationEmail = ({ token }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Heading style={h1}>🔢 Código de verificação</Heading>
        </Section>
        <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Este código expira em breve. Se você não solicitou, ignore este e-mail.<br />
          <strong>Quiz EBD ADREC</strong>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const PRIMARY = '#4CC9E0'
const DARK = '#05070D'
const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: DARK, margin: '0' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px', textAlign: 'center' as const }
const codeStyle = {
  fontFamily: 'Courier, monospace', fontSize: '32px', fontWeight: 'bold' as const,
  color: DARK, margin: '0', letterSpacing: '8px',
  backgroundColor: '#F1F8FA', border: `1px solid ${PRIMARY}33`,
  borderRadius: '12px', padding: '20px', display: 'inline-block',
}
const hr = { borderColor: '#E5E7EB', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#9CA3AF', textAlign: 'center' as const, margin: '0', lineHeight: '1.6' }
