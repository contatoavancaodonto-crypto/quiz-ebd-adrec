/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from './_brand.ts'

interface Props { token: string }

export const ReauthenticationEmail = ({ token }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação é {token}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandTitle}>📖 {BRAND.name}</Text>
          <span style={styles.brandBadge}>{BRAND.trimester}</span>
        </Section>

        <Section style={styles.body}>
          <Heading style={styles.h1}>🔢 Código de verificação</Heading>
          <Text style={{ ...styles.text, textAlign: 'center' }}>
            Use o código abaixo para confirmar sua identidade:
          </Text>
          <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
            <Text style={styles.code}>{token}</Text>
          </Section>
          <Text style={{ ...styles.small, textAlign: 'center' }}>
            Este código expira em alguns minutos. Se você não solicitou,
            ignore este e-mail.
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

export default ReauthenticationEmail
