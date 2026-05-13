/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Html, Preview, Section, Text, Heading, Link,
} from 'npm:@react-email/components@0.0.22'
import { TemplateEntry } from './registry.ts'

interface PasswordResetEmailProps {
  name?: string
  resetUrl?: string
}

export const PasswordResetEmail = ({ name, resetUrl = 'https://quizebd.com/auth' }: PasswordResetEmailProps) => {
  const displayName = name || 'irmão(ã)'
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Redefinição de Senha - Quiz EBD</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: '#f4f7fb', fontFamily: 'Arial, Helvetica, sans-serif', color: '#1f2937' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f4f7fb', padding: '30px 0' }}>
          <tr>
            <td align="center">
              <table width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: '620px', backgroundColor: '#ffffff', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>

                {/* Cabeçalho */}
                <tr>
                  <td style={{ background: 'linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)', backgroundColor: '#1d4ed8', padding: '35px 25px', textAlign: 'center' as const }}>
                    <Heading as="h1" style={{ margin: 0, color: '#ffffff', fontSize: '28px', fontWeight: 800 }}>
                      Redefinição de Senha 🔐
                    </Heading>
                    <Text style={{ margin: '10px 0 0', color: '#e0f2fe', fontSize: '16px' }}>
                      Quiz EBD
                    </Text>
                  </td>
                </tr>

                {/* Conteúdo */}
                <tr>
                  <td style={{ padding: '35px 30px 20px' }}>
                    <Text style={{ fontSize: '18px', lineHeight: 1.6, margin: '0 0 18px' }}>
                      A paz do Senhor, <strong>{displayName}</strong>! 🙌
                    </Text>
                    <Text style={{ fontSize: '16px', lineHeight: 1.7, margin: '0 0 18px' }}>
                      Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Quiz EBD</strong>.
                    </Text>
                    <Text style={{ fontSize: '16px', lineHeight: 1.7, margin: '0 0 22px' }}>
                      Para criar uma nova senha e continuar acessando sua jornada de estudos, quizzes e conquistas, clique no botão abaixo:
                    </Text>

                    {/* Botão */}
                    <table cellPadding={0} cellSpacing={0} align="center" style={{ margin: '30px auto' }}>
                      <tr>
                        <td align="center" style={{ backgroundColor: '#2563eb', borderRadius: '50px' }}>
                          <Link href={resetUrl} target="_blank" style={{ display: 'inline-block', padding: '15px 32px', color: '#ffffff', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold' }}>
                            Redefinir minha senha
                          </Link>
                        </td>
                      </tr>
                    </table>

                    {/* Box de segurança */}
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#eff6ff', borderLeft: '5px solid #2563eb', borderRadius: '12px', margin: '25px 0' }}>
                      <tr>
                        <td style={{ padding: '20px' }}>
                          <Heading as="h2" style={{ margin: '0 0 10px', fontSize: '20px', color: '#1d4ed8' }}>
                            Atenção à segurança
                          </Heading>
                          <Text style={{ margin: '0 0 10px', fontSize: '15px', lineHeight: 1.6 }}>
                            Se foi você quem solicitou a redefinição, basta seguir pelo botão acima.
                          </Text>
                          <Text style={{ margin: 0, fontSize: '15px', lineHeight: 1.6 }}>
                            Caso não tenha sido você, ignore este e-mail. Sua senha atual continuará a mesma.
                          </Text>
                        </td>
                      </tr>
                    </table>

                    <Text style={{ fontSize: '15px', lineHeight: 1.6, color: '#4b5563', margin: '0 0 10px' }}>
                      Por segurança, recomendamos que você escolha uma senha forte, com pelo menos 8 caracteres, combinando letras, números e símbolos.
                    </Text>
                    <Text style={{ fontSize: '15px', lineHeight: 1.6, color: '#4b5563', margin: '20px 0 10px' }}>
                      Se o botão não funcionar, copie e cole este link no seu navegador:
                    </Text>
                    <Text style={{ fontSize: '13px', lineHeight: 1.6, wordBreak: 'break-all' as const, color: '#2563eb', margin: '0 0 20px' }}>
                      {resetUrl}
                    </Text>

                    <Text style={{ fontSize: '16px', lineHeight: 1.6, margin: '25px 0 0' }}>
                      Deus abençoe! 🙏
                    </Text>
                  </td>
                </tr>

                {/* Rodapé */}
                <tr>
                  <td style={{ backgroundColor: '#f9fafb', padding: '22px 30px', textAlign: 'center' as const, borderTop: '1px solid #e5e7eb' }}>
                    <Text style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                      Secretaria EBD | Quiz EBD
                    </Text>
                    <Text style={{ margin: '8px 0 0', fontSize: '13px', color: '#9ca3af' }}>
                      Este é um e-mail automático de redefinição de senha.
                    </Text>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </Body>
    </Html>
  )
}

export const template: TemplateEntry = {
  component: PasswordResetEmail,
  subject: () => `Redefinição de senha - Quiz EBD`,
  displayName: "Redefinir Senha",
  previewData: {
    name: "João Silva",
    resetUrl: "https://quizebd.com/auth/reset-password"
  }
}

export default PasswordResetEmail
