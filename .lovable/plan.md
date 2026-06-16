## Objetivo

O badge no topo do Ranking (atualmente sempre "Ao vivo" / "Off" / "...") deve refletir o **status do trimestre selecionado**:

- **Ao vivo** → trimestre em andamento (hoje está entre a abertura e o encerramento)
- **Em breve** → trimestre ainda não começou
- **Encerrado** → trimestre já terminou

As datas de cada trimestre serão calculadas a partir da tabela `lessons`:
- **Abertura** = `MIN(scheduled_date)` das lições daquele trimestre (a data mais antiga / mais próxima de 01-01)
- **Encerramento** = `MAX(COALESCE(scheduled_end_date, scheduled_date))` (a data mais "velha"/última do trimestre)

Exemplo atual no banco: apenas o 2º trimestre tem lições cadastradas (04/05/2026 → 28/06/2026), então hoje (16/06/2026) ele é o único "Ao vivo". O 1º vira "Encerrado" e o 3º/4º viram "Em breve".

## Implementação (frontend apenas)

Arquivo: `src/pages/Ranking.tsx`

1. **Novo hook/query `useTrimesterWindows`** dentro do componente:
   ```ts
   const { data: trimesterWindows } = useQuery({
     queryKey: ["trimester-windows"],
     queryFn: async () => {
       const { data } = await supabase
         .from("lessons")
         .select("trimester, scheduled_date, scheduled_end_date");
       // reduz para { 1: {opens, closes} | null, 2: {...}, 3: ..., 4: ... }
     },
   });
   ```
   Para cada trimestre (1–4), agrega `min(scheduled_date)` e `max(scheduled_end_date ?? scheduled_date)`. Se não houver lições, fica `null`.

2. **Função `getTrimesterStatus(t)`**:
   - Se a janela existe e `now < opens` → `"upcoming"`
   - Se existe e `now > closes` → `"closed"`
   - Se existe e `opens ≤ now ≤ closes` → `"active"`
   - Se **não** existe janela (sem lições):
     - fallback por calendário: T1 = Jan–Mar, T2 = Abr–Jun, T3 = Jul–Set, T4 = Out–Dez do ano corrente, e aplica a mesma regra. Isso garante o comportamento pedido (T1 encerrado, T3/T4 em breve) mesmo sem lições cadastradas.

3. **Badge no `PageHero` (linha ~323)** passa a depender de `getTrimesterStatus(trimester)`:
   - `active` → mantém comportamento atual ("Ao vivo" verde pulsante quando `rtConnected`, "..." quando reconectando, "Off" caso contrário).
   - `upcoming` → badge azul/cinza com ícone de relógio e texto **"Em breve"** (sem ping).
   - `closed` → badge neutro/cinza com texto **"Encerrado"** (sem ping).

4. **Bônus de UX nos botões 1º/2º/3º/4º Tri.** (linhas 296–308):
   - Adicionar um pequeno indicador visual abaixo/ao lado do número:
     - ponto verde pulsante para o trimestre ativo
     - texto auxiliar discreto "Em breve" ou "Encerrado" para os demais
   - Mantém o clique funcional em todos (usuário pode visualizar rankings históricos/futuros), apenas comunica o status.

## Fora do escopo

- Nenhuma mudança no backend, views, migrations ou regras de pontuação.
- Nenhuma mudança na lógica de realtime: o badge "Ao vivo" continua exigindo conexão WebSocket — só passa a ser **suprimido** quando o trimestre selecionado não está ativo.
