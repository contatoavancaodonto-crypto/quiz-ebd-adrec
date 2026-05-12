/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr
} from 'npm:@react-email/components@0.0.22'
import { BRAND, styles } from '../email-templates/_brand.ts'
import { TemplateEntry } from './registry.ts'

interface QuizResultEmailProps {
  name?: string
  quizTitle: string
  score: number
  totalQuestions: number
  percentage: number
  rankingPosition?: number
  reviewUrl?: string
}

export const QuizResultEmail = ({ 
  name, 
  quizTitle, 
  score, 
  totalQuestions, 
  percentage, 
  rankingPosition,
  reviewUrl = 'https://quizebd.com/quizzes'
}: QuizResultEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu resultado do quiz: {quizTitle} - {percentage}% de acerto!</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandTitle}>📖 {BRAND.name}</Text>
          <Text style={styles.brandBadge}>RESULTADO DO QUIZ</Text>
        </Section>

        <Section style={styles.body}>
          <Heading style={styles.h1}>Parabéns pelo esforço{name ? `, ${name}` : ''}! 🏆</Heading>
          
          <Text style={styles.text}>
            Você acaba de concluir o quiz: <strong>{quizTitle}</strong>. Confira abaixo o seu desempenho:
          </Text>

          <Section style={{ 
            backgroundColor: BRAND.bgSoft, 
            borderRadius: '12px', 
            padding: '24px', 
            textAlign: 'center' as const,
            margin: '24px 0',
            border: `1px solid ${BRAND.border}`
          }}>
            <Text style={{ margin: '0', fontSize: '14px', color: BRAND.muted, fontWeight: 600 }}>PONTUAÇÃO</Text>
            <Heading style={{ margin: '8px 0', fontSize: '48px', color: BRAND.primary }}>
              {score}/{totalQuestions}
            </Heading>
            <Text style={{ margin: '0', fontSize: '18px', color: BRAND.dark, fontWeight: 700 }}>
              {percentage}% de Aproveitamento
            </Text>
            {rankingPosition && (
              <Text style={{ margin: '12px 0 0', fontSize: '14px', color: BRAND.text }}>
                Posição no Ranking: <strong>#{rankingPosition}</strong>
              </Text>
            )}
          </Section>
          
          <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
            <Button href={reviewUrl} style={styles.button}>
              Ver Revisão Completa
            </Button>
          </Section>

          <Text style={styles.text}>
            Continue estudando e participando. Cada quiz é uma oportunidade de crescer na graça e no conhecimento!
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
  component: QuizResultEmail,
  subject: (data) => `Resultado: ${data.quizTitle} - ${data.percentage}% de acerto`,
  displayName: "Resultado de Quiz",
  previewData: {
    name: "João Silva",
    quizTitle: "A Armadura de Deus",
    score: 8,
    totalQuestions: 10,
    percentage: 80,
    rankingPosition: 5,
    reviewUrl: "https://quizebd.com/quizzes/review/123"
  }
}

export default QuizResultEmail
