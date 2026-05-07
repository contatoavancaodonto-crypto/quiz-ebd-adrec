/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from './_brand.ts'

interface Props { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ siteName, confirmationUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefinir sua senha no Quiz EBD</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandTitle}>📖 {BRAND.name}</Text>
        </Section>

        <Section style={styles.body}>
          <Heading style={styles.h1}>🔐 Redefinir senha</Heading>
          <Text style={styles.text}>Paz do Senhor! 🙏</Text>
          <Text style={styles.text}>
            Recebemos um pedido para redefinir sua senha no{' '}
            <strong>{BRAND.name}</strong>. Clique no botão abaixo para escolher
            uma nova senha:
          </Text>
          <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
            <Button href={confirmationUrl} style={styles.button}>
              Redefinir minha senha
            </Button>
          </Section>
          <Text style={styles.small}>
            Se o botão não funcionar, copie e cole este link:<br />
            <span style={styles.link}>{confirmationUrl}</span>
          </Text>
          <Text style={styles.small}>
            Se você não solicitou esta alteração, ignore este e-mail —
            sua senha permanecerá a mesma.
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

export default RecoveryEmail
