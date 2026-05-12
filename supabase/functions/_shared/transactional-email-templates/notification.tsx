/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from '../email-templates/_brand.ts'
import { TemplateEntry } from './registry.ts'

interface NotificationEmailProps {
  title: string
  message: string
  ctaLabel?: string
  ctaUrl?: string
}

export const NotificationEmail = ({ 
  title, 
  message, 
  ctaLabel, 
  ctaUrl 
}: NotificationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{title}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandTitle}>📖 {BRAND.name}</Text>
          <Text style={styles.brandBadge}>NOTIFICAÇÃO</Text>
        </Section>

        <Section style={styles.body}>
          <Heading style={styles.h1}>{title}</Heading>
          
          <Text style={styles.text}>
            {message}
          </Text>

          {ctaLabel && ctaUrl && (
            <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
              <Button href={ctaUrl} style={styles.button}>
                {ctaLabel}
              </Button>
            </Section>
          )}

          <Text style={styles.text}>
            Se tiver qualquer dúvida, entre em contato conosco.
          </Text>

          <Text style={styles.text}>
            Paz do Senhor! 🙏
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
  component: NotificationEmail,
  subject: (data) => data.title,
  displayName: "Notificação Geral",
  previewData: {
    title: "Atualização importante na sua classe",
    message: "Gostaríamos de informar que o horário da aula de domingo foi alterado para as 09:30h. Esperamos você lá!",
    ctaLabel: "Ver detalhes",
    ctaUrl: "https://quizebd.com/dashboard"
  }
}

export default NotificationEmail
