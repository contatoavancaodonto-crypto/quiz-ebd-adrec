import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSubmitAnswerTest() {
  console.log("🚀 Iniciando teste da função submit_answer...");
  
  try {
    const { data: participants } = await supabase.from('participants').select('id').limit(1);
    const participantId = participants?.[0]?.id;

    const { data: lessons } = await supabase.from('lessons').select('id, questions').limit(10);
    const lesson = lessons?.find(l => Array.isArray(l.questions) && l.questions.length > 0);
    
    if (!lesson || !participantId) {
        console.error("❌ Dados insuficientes:", { lesson: !!lesson, participantId: !!participantId });
        return;
    }

    const questions = lesson.questions as any[];
    const testQuestion = questions[0];
    const questionId = testQuestion.id;
    const correctOption = testQuestion.respostaCorreta || testQuestion.correct_option || 'A';

    console.log(`📝 Testando com Lição: ${lesson.id}, Pergunta: ${questionId}, Resposta: ${correctOption}`);

    const { data: attempt } = await supabase.from('quiz_attempts').insert({
        participant_id: participantId,
        lesson_id: lesson.id,
        source_type: 'lesson_json',
        total_questions: questions.length
    }).select().single();

    if (!attempt) return console.error("❌ Erro ao criar tentativa");

    // Teste 1: Correta
    const { data: resultCorrect } = await supabase.rpc('submit_answer', {
      p_attempt_id: attempt.id,
      p_question_id: String(questionId),
      p_selected_option: correctOption
    });
    const isCorrectVal = Array.isArray(resultCorrect) ? resultCorrect[0]?.is_correct : (resultCorrect as any)?.is_correct;
    console.log(isCorrectVal ? "✅ OK: Correta validada" : "❌ FALHA: Correta negada", resultCorrect);

    // Teste 2: Incorreta
    const wrongOption = correctOption.toUpperCase() === 'A' ? 'B' : 'A';
    const { data: resultWrong } = await supabase.rpc('submit_answer', {
      p_attempt_id: attempt.id,
      p_question_id: String(questionId),
      p_selected_option: wrongOption
    });
    const isWrongVal = Array.isArray(resultWrong) ? resultWrong[0]?.is_correct : (resultWrong as any)?.is_correct;
    console.log(isWrongVal === false ? "✅ OK: Incorreta validada" : "❌ FALHA: Incorreta aceita", resultWrong);

    // Teste 3: Validar que salvou no banco corretamente (question_ref)
    const { data: dbAnswer } = await supabase.from('answers').select('*').eq('attempt_id', attempt.id).eq('question_ref', String(questionId)).single();
    if (dbAnswer && dbAnswer.question_ref === String(questionId)) {
        console.log("✅ OK: Resposta salva com question_ref");
    } else {
        console.error("❌ FALHA: Resposta não encontrada no banco com question_ref");
    }

  } catch (err) {
    console.error("💥 Erro:", err);
  }
}

runSubmitAnswerTest();
