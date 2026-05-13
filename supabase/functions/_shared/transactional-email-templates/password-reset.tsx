/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from '../email-templates/_brand.ts'
import { TemplateEntry } from './registry.ts'

interface PasswordResetEmailProps {
  name?: string
  resetUrl?: string
}

export const PasswordResetEmail = ({ name, resetUrl = 'https://quizebd.com/auth' }: PasswordResetEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefinição de senha solicitada no {BRAND.name}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandTitle}>📖 {BRAND.name}</Text>
          <Text style={styles.brandBadge}>SEGURANÇA DA CONTA</Text>
        </Section>

        <Section style={styles.body}>
          <Heading style={styles.h1}>Olá{name ? `, ${name}` : ''}!</Heading>
          <Text style={styles.text}>
            Recebemos uma solicitação para redefinir a senha da sua conta no <strong>{BRAND.name}</strong>.
          </Text>
          <Text style={styles.text}>
            Se foi você quem solicitou, clique no botão abaixo para escolher uma nova senha:
          </Text>
          
          <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
            <Button href={resetUrl} style={styles.button}>
              Redefinir minha Senha
            </Button>
          </Section>

          <Text style={styles.text}>
            Se você não solicitou a troca da senha, pode ignorar este e-mail. Sua senha atual continuará funcionando normalmente.
          </Text>

          <Hr style={styles.hr} />
          
          <Text style={styles.small}>
            Por motivos de segurança, este link expira em 24 horas. Se precisar de ajuda, entre em contato com o suporte da sua congregação.
          </Text>
        </Section>

        <Section style={styles.footer}>
          <Text style={styles.footerText}>Enviado por</Text>
          <Text style={styles.footerBrand}>{BRAND.name}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template: TemplateEntry = {
  component: PasswordResetEmail,
  subject: (data) => `Redefinição de senha - ${BRAND.name}`,
  displayName: "Redefinir Senha",
  previewData: {
    name: "João Silva",
    resetUrl: "https://quizebd.com/auth/reset-password"
  }
}

export default PasswordResetEmail
