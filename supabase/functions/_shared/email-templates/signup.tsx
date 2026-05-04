/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, confirmationUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Heading style={h1}>📖 Bem-vindo(a) ao Quiz EBD!</Heading>
        </Section>
        <Text style={text}>Paz do Senhor! 🙏</Text>
        <Text style={text}>
          Estamos felizes em ter você no <strong>{siteName}</strong>. Para começar a participar dos
          quizzes da Escola Bíblica Dominical, confirme seu e-mail clicando no botão abaixo:
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={confirmationUrl} style={button}>Confirmar meu e-mail</Button>
        </Section>
        <Text style={small}>
          Se o botão não funcionar, copie e cole este link no navegador:<br />
          <span style={link}>{confirmationUrl}</span>
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Se você não criou esta conta, pode ignorar este e-mail.<br />
          <strong>{siteName}</strong>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const PRIMARY = '#4CC9E0'
const DARK = '#05070D'
const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: DARK, margin: '0' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const small = { fontSize: '12px', color: '#9CA3AF', lineHeight: '1.5', margin: '16px 0 0' }
const link = { color: PRIMARY, wordBreak: 'break-all' as const }
const button = {
  backgroundColor: PRIMARY, color: '#ffffff', padding: '14px 32px',
  borderRadius: '10px', fontSize: '16px', fontWeight: 'bold' as const,
  textDecoration: 'none', display: 'inline-block',
}
const hr = { borderColor: '#E5E7EB', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#9CA3AF', textAlign: 'center' as const, margin: '0', lineHeight: '1.6' }
