/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from './_brand.ts'

interface Props {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ oldEmail, newEmail, confirmationUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu novo e-mail no Quiz EBD</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandTitle}>📖 {BRAND.name}</Text>
        </Section>

        <Section style={styles.body}>
          <Heading style={styles.h1}>✉️ Confirmar novo e-mail</Heading>
          <Text style={styles.text}>Paz do Senhor! 🙏</Text>
          <Text style={styles.text}>
            Você solicitou alterar o e-mail da sua conta no{' '}
            <strong>{BRAND.name}</strong>:
          </Text>
          <Text style={styles.text}>
            De <Link href={`mailto:${oldEmail}`} style={styles.link}>{oldEmail}</Link>
            <br />
            Para <Link href={`mailto:${newEmail}`} style={styles.link}>{newEmail}</Link>
          </Text>
          <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
            <Button href={confirmationUrl} style={styles.button}>
              Confirmar alteração
            </Button>
          </Section>
          <Text style={styles.small}>
            Se você não solicitou esta alteração, proteja sua conta
            redefinindo a senha imediatamente.
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

export default EmailChangeEmail
