/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from './_brand.ts'

interface Props { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ confirmationUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidado(a) para o {BRAND.name}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandTitle}>📖 {BRAND.name}</Text>
          <span style={styles.brandBadge}>{BRAND.trimester}</span>
        </Section>

        <Section style={styles.body}>
          <Heading style={styles.h1}>🎉 Você foi convidado(a)!</Heading>
          <Text style={styles.text}>Paz do Senhor! 🙏</Text>
          <Text style={styles.text}>
            Você recebeu um convite para participar do{' '}
            <strong>{BRAND.name}</strong>. Aceite e crie sua conta para começar
            a responder os quizzes da EBD:
          </Text>
          <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
            <Button href={confirmationUrl} style={styles.button}>
              Aceitar convite
            </Button>
          </Section>
          <Text style={styles.small}>
            Se você não esperava este convite, pode ignorar este e-mail.
          </Text>
        </Section>

        <Section style={styles.footer}>
          <Text style={styles.footerText}>Enviado por</Text>
          <Text style={styles.footerBrand}>{BRAND.name} · {BRAND.church}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
