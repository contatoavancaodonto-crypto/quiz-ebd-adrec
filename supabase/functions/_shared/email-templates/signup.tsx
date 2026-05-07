/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from './_brand.ts'

interface Props {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, confirmationUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail e comece a participar do Quiz EBD</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandTitle}>📖 {BRAND.name}</Text>
        </Section>

        <Section style={styles.body}>
          <Heading style={styles.h1}>Bem-vindo(a) à EBD! 🎉</Heading>
          <Text style={styles.text}>Paz do Senhor! 🙏</Text>
          <Text style={styles.text}>
            Que alegria ter você aqui. Para começar a responder os quizzes da
            Escola Bíblica Dominical e disputar o ranking da sua classe,
            confirme seu e-mail clicando no botão abaixo:
          </Text>
          <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
            <Button href={confirmationUrl} style={styles.button}>
              Confirmar meu e-mail
            </Button>
          </Section>
          <Text style={styles.small}>
            Se o botão não funcionar, copie e cole este link no navegador:<br />
            <span style={styles.link}>{confirmationUrl}</span>
          </Text>
          <Text style={styles.small}>
            Se você não criou esta conta, pode ignorar este e-mail.
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

export default SignupEmail
