/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, oldEmail, newEmail, confirmationUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração de e-mail no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Heading style={h1}>✉️ Confirmar novo e-mail</Heading>
        </Section>
        <Text style={text}>Paz do Senhor! 🙏</Text>
        <Text style={text}>
          Você solicitou alterar seu e-mail no <strong>{siteName}</strong> de{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>{oldEmail}</Link> para{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={confirmationUrl} style={button}>Confirmar alteração</Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Se você não solicitou esta alteração, proteja sua conta imediatamente.<br />
          <strong>{siteName}</strong>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const PRIMARY = '#4CC9E0'
const DARK = '#05070D'
const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: DARK, margin: '0' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const link = { color: PRIMARY, textDecoration: 'underline' }
const button = {
  backgroundColor: PRIMARY, color: '#ffffff', padding: '14px 32px',
  borderRadius: '10px', fontSize: '16px', fontWeight: 'bold' as const,
  textDecoration: 'none', display: 'inline-block',
}
const hr = { borderColor: '#E5E7EB', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#9CA3AF', textAlign: 'center' as const, margin: '0', lineHeight: '1.6' }
