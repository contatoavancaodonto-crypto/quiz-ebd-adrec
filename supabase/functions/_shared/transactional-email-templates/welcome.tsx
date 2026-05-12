/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from '../email-templates/_brand.ts'
import { TemplateEntry } from './registry.ts'

interface WelcomeEmailProps {
  name?: string
  dashboardUrl?: string
}

export const WelcomeEmail = ({ name, dashboardUrl = 'https://quizebd.com' }: WelcomeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Bem-vindo ao Quiz EBD - Sua jornada de conhecimento bíblico começa aqui!</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandTitle}>📖 {BRAND.name}</Text>
          <Text style={styles.brandBadge}>CONTA VERIFICADA</Text>
        </Section>

        <Section style={styles.body}>
          <Heading style={styles.h1}>Olá{name ? `, ${name}` : ''}! 🎉</Heading>
          <Text style={styles.text}>
            Seja muito bem-vindo(a) ao <strong>{BRAND.name}</strong>. É uma honra ter você conosco em nossa missão de aprender mais sobre a Palavra de Deus de forma dinâmica e divertida.
          </Text>
          <Text style={styles.text}>
            A partir de agora, você pode responder aos quizzes semanais da Escola Bíblica Dominical, acompanhar seu progresso e ver sua posição no ranking da sua classe.
          </Text>
          
          <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
            <Button href={dashboardUrl} style={styles.button}>
              Acessar meu Painel
            </Button>
          </Section>

          <Hr style={styles.hr} />
          
          <Text style={styles.text}>
            <strong>O que você pode fazer agora?</strong>
          </Text>
          <ul style={{ ...styles.text, paddingLeft: '20px' }}>
            <li>Explorar os quizzes disponíveis</li>
            <li>Baixar materiais de apoio para suas aulas</li>
            <li>Acompanhar o ranking da sua congregação</li>
          </ul>

          <Text style={styles.text}>
            Paz do Senhor e bons estudos! 🙏
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
  component: WelcomeEmail,
  subject: (data) => `Bem-vindo ao ${BRAND.name}${data.name ? ', ' + data.name : ''}!`,
  displayName: "Boas-vindas",
  previewData: {
    name: "João Silva",
    dashboardUrl: "https://quizebd.com/dashboard"
  }
}

export default WelcomeEmail
