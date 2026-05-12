/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from '../email-templates/_brand.ts'
import { TemplateEntry } from './registry.ts'

interface NewQuizEmailProps {
  quizTitle: string
  description?: string
  quizUrl?: string
  deadline?: string
}

export const NewQuizEmail = ({ 
  quizTitle, 
  description, 
  quizUrl = 'https://quizebd.com/quizzes',
  deadline
}: NewQuizEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Novo Quiz Disponível: {quizTitle} - Desafie seu conhecimento!</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandTitle}>📖 {BRAND.name}</Text>
          <Text style={styles.brandBadge}>NOVO DESAFIO</Text>
        </Section>

        <Section style={styles.body}>
          <Heading style={styles.h1}>Tem quiz novo na área! 📝</Heading>
          
          <Text style={styles.text}>
            Paz do Senhor! Um novo quiz acaba de ser publicado e já está disponível para você testar seus conhecimentos bíblicos.
          </Text>

          <Section style={{ 
            backgroundColor: BRAND.bgSoft, 
            borderRadius: '12px', 
            padding: '24px', 
            margin: '24px 0',
            border: `1px solid ${BRAND.border}`
          }}>
            <Heading style={{ margin: '0 0 8px', fontSize: '18px', color: BRAND.dark }}>
              {quizTitle}
            </Heading>
            {description && (
              <Text style={{ margin: '0 0 16px', fontSize: '14px', color: BRAND.text }}>
                {description}
              </Text>
            )}
            {deadline && (
              <Text style={{ margin: '0', fontSize: '12px', color: BRAND.muted }}>
                📅 Disponível até: <strong>{deadline}</strong>
              </Text>
            )}
          </Section>
          
          <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
            <Button href={quizUrl} style={styles.button}>
              Responder Agora
            </Button>
          </Section>

          <Text style={styles.text}>
            Não perca tempo! Responda o quanto antes para garantir sua posição no ranking semanal da nossa EBD.
          </Text>

          <Text style={styles.text}>
            Bons estudos e que Deus te abençoe! 🙏
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
  component: NewQuizEmail,
  subject: (data) => `📝 Novo Quiz: ${data.quizTitle}`,
  displayName: "Novo Quiz Disponível",
  previewData: {
    quizTitle: "Parábolas de Jesus",
    description: "Um quiz especial sobre as principais parábolas contadas por Cristo nos evangelhos sinóticos.",
    deadline: "Domingo, 18:00h",
    quizUrl: "https://quizebd.com/quizzes/456"
  }
}

export default NewQuizEmail
