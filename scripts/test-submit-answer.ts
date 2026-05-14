import { supabase } from "../../src/integrations/supabase/client";

// Este script testa a função submit_answer diretamente no banco
// Ele cria uma tentativa de teste e submete respostas para validar a lógica
async function runSubmitAnswerTest() {
  console.log("🚀 Iniciando teste da função submit_answer...");

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
    const { data: lessons, error: lError } = await supabase
      .from('lessons')
      .select('id, questions')
      .not('questions', 'is', null)
      .limit(1);

    if (lError || !lessons || lessons.length === 0) {
      console.error("❌ Nenhuma lição com perguntas encontrada para o teste.");
      return;
    }
    const lesson = lessons[0];
    const questions = lesson.questions as any[];
    
    if (!questions || questions.length === 0) {
      console.error("❌ A lição encontrada não tem perguntas no JSON.");
      return;
    }

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
    const { data: resultCorrect, error: scError } = await supabase.rpc('submit_answer', {
      p_attempt_id: attempt.id,
      p_question_id: String(questionId),
      p_selected_option: correctOption
    });

    if (scError) {
      console.error("❌ Erro na RPC submit_answer (correta):", scError);
    } else {
      console.log("📊 Resultado (esperado is_correct: true):", resultCorrect);
      if (resultCorrect[0]?.is_correct === true) {
        console.log("✨ SUCESSO: Resposta correta validada!");
      } else {
        console.error("FAILED: Resposta correta marcada como errada.");
      }
    }

    // 5. Testar resposta INCORRETA
    const wrongOption = correctOption === 'A' ? 'B' : 'A';
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
      if (resultWrong[0]?.is_correct === false) {
        console.log("✨ SUCESSO: Resposta incorreta validada!");
      } else {
        console.error("FAILED: Resposta incorreta marcada como certa.");
      }
    }

    // Limpeza (opcional): remover tentativa e respostas de teste
    // await supabase.from('answers').delete().eq('attempt_id', attempt.id);
    // await supabase.from('quiz_attempts').delete().eq('id', attempt.id);

  } catch (err) {
    console.error("💥 Erro inesperado durante o teste:", err);
  }
}

runSubmitAnswerTest();
