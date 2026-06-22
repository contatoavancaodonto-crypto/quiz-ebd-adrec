## Liberação automática do Provão após a Lição 13

Hoje a Home já mostra um card separado de "Provão Trimestral" e o botão principal sempre diz "Responder Quiz". Vou transformar esse botão principal para refletir três estados de progresso do trimestre.

### Comportamento
- **Estado 1 — Lições 1 a 12 (ou L13 ainda não respondida):** botão = `Responder Quiz` → abre quiz da semana corrente.
- **Estado 2 — Lição 13 concluída e Provão ainda não feito:** botão = `🏆 Fazer Provão` → abre o quiz `quiz_kind = 'trimestral'`.
- **Estado 3 — Provão concluído:** botão = `✅ Provão Concluído` (desabilitado) + atalhos para Resultado, Certificado e Ranking.

### Como detectar a conclusão da Lição 13
Adicionar um hook `useTrimesterProgress(classId, seasonId, participantId)` que consulta `quiz_attempts` filtrando pelo `season_id` da temporada ativa e retorna:
- `completedLesson13`: existe attempt finalizado cujo quiz tem `lesson_number = 13` e `quiz_kind = 'weekly'`.
- `completedExam`: existe attempt finalizado com `quiz_kind = 'trimestral'`.

Sem nova coluna no banco — o estado é derivado das tentativas existentes.

### Gate de acesso ao Provão
- Front: bloquear o botão `Fazer Provão` quando `completedLesson13 === false`, exibindo toast: "Conclua a Lição 13 para liberar o Provão".
- Back (defesa em profundidade): adicionar checagem no início do quiz trimestral via uma função `can_take_provao(p_participant_id uuid, p_season_id uuid)` ou validar dentro de um trigger no `quiz_attempts` (INSERT com `quiz_kind='trimestral'` exige attempt L13 finalizado).

### Banco de questões do Provão
A função `get_trimestral_provao_questions(class_id, season_id)` já existe e monta as perguntas a partir das lições 1–13 do trimestre, embaralhando e garantindo cobertura. Mantemos como está.

### Pontuação 22 pontos
A regra atual de score do provão é por acertos. Para fixar em "22 pontos", definir `total_questions = 22` nos quizzes trimestrais e manter score por acertos (cada questão = 1 pt, máx 22). Sem mudança de schema; apenas garantir esse valor na criação do provão (admin).

### UI mobile
`MobileBottomNav` já tem o FAB central. Vou mudar o `fabLabel` e `onFabClick` em `Index.tsx` conforme o estado calculado.

### Arquivos
- novo: `src/hooks/useTrimesterProgress.ts`
- editar: `src/pages/Index.tsx` — calcular estado, ajustar label/handler do FAB e do CTA principal, mostrar "Provão Concluído" disabled.
- editar: `src/components/membro/MobileBottomNav.tsx` — aceitar `fabDisabled` opcional.
- migration (opcional, defesa): trigger `enforce_provao_prerequisite` em `quiz_attempts`.

### Fora de escopo
Geração de certificado (assumo que já existe ou é tela futura) e mudança das views de ranking (o provão já entra no `total_score` porque é um attempt finalizado).
