import { createClient } from '@supabase/supabase-js';

// Usar variáveis de ambiente do sandbox para configurar o cliente
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSubmitAnswerTest() {
  console.log("🚀 Iniciando teste da função submit_answer...");
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão definidas.");
    return;
  }

  try {
    // 1. Obter um participante para o teste
    const { data: participants, error: pError } = await supabase
      .from('participants')
      .select('id')
      .limit(1);

    if (pError || !participants || participants.length === 0) {
      console.error("❌ Erro ao buscar participante:", pError);
      return;
    }
    const participantId = participants[0].id;

    // 2. Buscar uma lição que tenha perguntas no JSON
    // Buscamos especificamente uma que tenha perguntas no JSON (campo 'questions')
    const { data: lessons, error: lError } = await supabase
      .from('lessons')
      .select('id, questions')
      .not('questions', 'is', null)
      .limit(5);

    if (lError || !lessons || lessons.length === 0) {
      console.error("❌ Nenhuma lição com perguntas encontrada para o teste.");
      return;
    }
    
    // Filtrar por lições que tenham array de perguntas válido
    const lesson = lessons.find(l => Array.isArray(l.questions) && l.questions.length > 0);
    
    if (!lesson) {
        console.error("❌ Nenhuma lição encontrada com array de perguntas válido.");
        return;
    }

    const questions = lesson.questions as any[];
    const testQuestion = questions[0];
    const questionId = testQuestion.id;
    const correctOption = testQuestion.respostaCorreta || testQuestion.correct_option || 'A';

    console.log(`📝 Testando com Lição: ${lesson.id}, Pergunta: ${questionId}, Resposta Correta: ${correctOption}`);

    // 3. Criar uma tentativa
    const { data: attempt, error: aError } = await supabase
      .from('quiz_attempts')
      .insert({
        participant_id: participantId,
        lesson_id: lesson.id,
        source_type: 'lesson_json',
        total_questions: questions.length
      })
      .select()
      .single();

    if (aError) {
      console.error("❌ Erro ao criar tentativa:", aError);
      return;
    }
    console.log(`✅ Tentativa criada: ${attempt.id}`);

    // 4. Testar submit_answer via RPC (Chamada da função do banco)
    console.log("📡 Chamando submit_answer para resposta CORRETA...");
    // A função retorna um array de objetos devido à definição 'RETURNS TABLE'
    const { data: resultCorrect, error: scError } = await supabase.rpc('submit_answer', {
      p_attempt_id: attempt.id,
      p_question_id: String(questionId),
      p_selected_option: correctOption
    });

    if (scError) {
      console.error("❌ Erro na RPC submit_answer (correta):", scError);
    } else {
      console.log("📊 Resultado (esperado is_correct: true):", resultCorrect);
      // O resultado de uma table function no supabase-js vem como array
      const isCorrect = Array.isArray(resultCorrect) ? resultCorrect[0]?.is_correct : (resultCorrect as any)?.is_correct;
      
      if (isCorrect === true) {
        console.log("✨ SUCESSO: Resposta correta validada!");
      } else {
        console.error("❌ FALHA: Resposta correta marcada como errada ou não retornou esperado.");
      }
    }

    // 5. Testar resposta INCORRETA
    const wrongOption = correctOption.toUpperCase() === 'A' ? 'B' : 'A';
    console.log(`📡 Chamando submit_answer para resposta INCORRETA (${wrongOption})...`);
    const { data: resultWrong, error: swError } = await supabase.rpc('submit_answer', {
      p_attempt_id: attempt.id,
      p_question_id: String(questionId),
      p_selected_option: wrongOption
    });

    if (swError) {
      console.error("❌ Erro na RPC submit_answer (incorreta):", swError);
    } else {
      console.log("📊 Resultado (esperado is_correct: false):", resultWrong);
      const isCorrect = Array.isArray(resultWrong) ? resultWrong[0]?.is_correct : (resultWrong as any)?.is_correct;

      if (isCorrect === false) {
        console.log("✨ SUCESSO: Resposta incorreta validada!");
      } else {
        console.error("❌ FALHA: Resposta incorreta marcada como certa ou não retornou esperado.");
      }
    }

    console.log("\n🏁 Testes concluídos com sucesso.");

  } catch (err) {
    console.error("💥 Erro inesperado durante o teste:", err);
  }
}

runSubmitAnswerTest();
