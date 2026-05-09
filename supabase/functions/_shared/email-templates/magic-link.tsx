/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from './_brand.ts'

interface Props { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ siteName, confirmationUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso ao Quiz EBD</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandTitle}>📖 {BRAND.name}</Text>
        </Section>

        <Section style={styles.body}>
          <Heading style={styles.h1}>✨ Seu link de acesso</Heading>
          <Text style={styles.text}>Paz do Senhor! 🙏</Text>
          <Text style={styles.text}>
            Use o botão abaixo para entrar no <strong>{BRAND.name}</strong>.
            Por segurança, este link expira em alguns minutos.
          </Text>
          <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
            <Button href={confirmationUrl} style={styles.button}>
              Entrar agora
            </Button>
          </Section>
          <Text style={styles.small}>
            Se você não solicitou este link, pode ignorar este e-mail com segurança.
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

export default MagicLinkEmail
