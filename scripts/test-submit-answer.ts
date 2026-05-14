import { createClient } from '@supabase/supabase-js';

// Usar Service Role Key para ignorar RLS durante o teste se possível
// Se não, vamos simular um usuário autenticado se soubermos um ID
const supabaseUrl = "https://ndautjliwnpnbpxvfsik.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kYXV0amxpd25wbmJweHZmc2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NjAxOTEsImV4cCI6MjA4OTUzNjE5MX0.TmY8PncrvWs5Lh2uu9F3-zbgPHMQoczmQwVAf_PmOiE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSubmitAnswerTest() {
  console.log("🚀 Iniciando teste da função submit_answer...");
  
  try {
    // 1. Precisamos de um participante que tenha user_id para que RLS permita o teste
    const { data: participant, error: pError } = await supabase
      .from('participants')
      .select('id, user_id')
      .not('user_id', 'is', null)
      .limit(1)
      .single();

    if (pError || !participant) {
        console.error("❌ Nenhum participante com user_id encontrado para simular sessão.");
        return;
    }

    console.log(`👤 Simulando participante: ${participant.id} (User: ${participant.user_id})`);

    // 2. Buscar lição e questões
    // Usamos um ID que sabemos que existe
    const lessonId = 'd6339eef-e8a4-4094-a975-5455d0693232';
    
    // Como o script roda como "anon", se RLS bloquear a lição, precisamos de uma forma de ler
    // Vamos tentar ler todas as lições visíveis
    const { data: lesson, error: lError } = await supabase.from('lessons').select('*').eq('id', lessonId).maybeSingle();
    
    if (lError || !lesson) {
        console.error("❌ Erro ao buscar lição (pode ser RLS):", lError);
        console.log("Tentando buscar qualquer lição visível...");
        const { data: anyLesson } = await supabase.from('lessons').select('*').limit(1);
        if (!anyLesson || anyLesson.length === 0) {
            console.error("❌ Nenhuma lição visível via SDK (RLS está restringindo tudo).");
            return;
        }
    }

    const targetLesson = lesson || (await supabase.from('lessons').select('*').limit(1)).data?.[0];
    const questions = targetLesson.questions as any[];
    const testQuestion = questions[0];
    const questionId = testQuestion.id;
    const correctOption = testQuestion.respostaCorreta || testQuestion.correct_option || 'A';

    console.log(`📝 Testando com Lição: ${targetLesson.id}, Pergunta: ${questionId}`);

    // 3. Criar tentativa
    // IMPORTANTE: Para passar no RLS de quiz_attempts, precisamos que o auth.uid() coincida com participant.user_id
    // Em scripts externos 'anon', isso não acontece.
    // MAS a função RPC submit_answer usa SECURITY DEFINER, então ela ignora RLS da tabela 'answers'.
    // No entanto, a criação da tentativa (INSERT) pode falhar.
    
    // Vamos tentar criar a tentativa via SQL (psql) para ignorar RLS e depois testar o RPC
    console.log("🛠️ Criando tentativa via psql para bypassar RLS...");
    const { execSync } = require('child_process');
    const attemptId = execSync(`psql -t -A -c "INSERT INTO public.quiz_attempts (participant_id, lesson_id, source_type, total_questions) VALUES ('${participant.id}', '${targetLesson.id}', 'lesson_json', ${questions.length}) RETURNING id;"`).toString().trim();
    
    console.log(`✅ Tentativa criada via psql: ${attemptId}`);

    // 4. Testar submit_answer (RPC)
    // Precisamos simular o JWT do usuário no RPC? 
    // A função verifica: IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized';
    // No Bun/SDK anon, auth.uid() é NULL.
    
    // Solução: Testar o RPC via psql chamando a função diretamente com um session_set para auth.uid
    console.log("📡 Chamando submit_answer via psql (simulando auth)...");
    const sqlCorrect = `
      BEGIN;
      SET LOCAL "request.jwt.claims" = '{"sub": "${participant.user_id}"}';
      SELECT * FROM public.submit_answer('${attemptId}', '${questionId}', '${correctOption}');
      COMMIT;
    `;
    const resCorrect = execSync(`psql -t -A -c "${sqlCorrect}"`).toString().trim();
    console.log("📊 Resultado Correta:", resCorrect);
    
    if (resCorrect.includes('t')) {
        console.log("✨ SUCESSO: Resposta correta validada pelo banco!");
    } else {
        console.error("❌ FALHA: Resposta correta negada.");
    }

    const wrongOption = correctOption.toUpperCase() === 'A' ? 'B' : 'A';
    const sqlWrong = `
      BEGIN;
      SET LOCAL "request.jwt.claims" = '{"sub": "${participant.user_id}"}';
      SELECT * FROM public.submit_answer('${attemptId}', '${questionId}', '${wrongOption}');
      COMMIT;
    `;
    const resWrong = execSync(`psql -t -A -c "${sqlWrong}"`).toString().trim();
    console.log("📊 Resultado Incorreta:", resWrong);
    
    if (resWrong.includes('f')) {
        console.log("✨ SUCESSO: Resposta incorreta invalidada pelo banco!");
    } else {
        console.error("❌ FALHA: Resposta incorreta aceita.");
    }

  } catch (err) {
    console.error("💥 Erro:", err);
  }
}

runSubmitAnswerTest();
