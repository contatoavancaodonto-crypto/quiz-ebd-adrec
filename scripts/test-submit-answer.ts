async function runSubmitAnswerTest() {
  console.log("🚀 Iniciando teste da função submit_answer...");
  
  try {
    const { execSync } = require('child_process');

    const participantJson = execSync(`psql -t -A -c "SELECT json_build_object('id', id, 'user_id', user_id) FROM public.participants WHERE user_id IS NOT NULL LIMIT 1;"`).toString().trim();
    const participant = JSON.parse(participantJson);

    const lessonId = 'd6339eef-e8a4-4094-a975-5455d0693232';
    const lessonJson = execSync(`psql -t -A -c "SELECT json_build_object('id', id, 'questions', questions) FROM public.lessons WHERE id = '${lessonId}';"`).toString().trim();
    const lesson = JSON.parse(lessonJson);

    const questions = lesson.questions;
    const testQuestion = questions[0];
    const questionId = testQuestion.id;
    const correctOption = (testQuestion.respostaCorreta || testQuestion.correct_option || 'A').toUpperCase();

    const attemptId = execSync(`psql -t -A -c "INSERT INTO public.quiz_attempts (participant_id, lesson_id, source_type, total_questions) VALUES ('${participant.id}', '${lesson.id}', 'lesson_json', ${questions.length}) RETURNING id;"`).toString().trim().split('\n')[0];
    console.log(`✅ Tentativa: ${attemptId}`);

    // JWT Claims com escape triplo para shell -> psql
    const jwtClaims = `{\\"\\"sub\\"\\": \\"\\"${participant.user_id}\\"\\"}`;
    
    // Teste 1: Correta
    console.log("📡 Testando resposta CORRETA...");
    // Vamos usar a flag -v para passar variáveis se o escape falhar
    const resCorrect = execSync(`psql -t -A -c "SET LOCAL \\"request.jwt.claims\\" = '{\\"sub\\": \\"${participant.user_id}\\"}'; SELECT is_correct FROM public.submit_answer('${attemptId}', '${questionId}', '${correctOption}');"`).toString().trim();
    console.log("📊 Resposta Correta:", resCorrect === 't' ? "✅ SUCESSO" : "❌ FALHA (" + resCorrect + ")");

    // Teste 2: Finalizar tentativa para testar gabarito
    console.log("📡 Finalizando tentativa...");
    execSync(`psql -c "UPDATE public.quiz_attempts SET finished_at = now() WHERE id = '${attemptId}';"`);

    // Teste 3: Gabarito
    const resGabarito = execSync(`psql -t -A -c "SET LOCAL \\"request.jwt.claims\\" = '{\\"sub\\": \\"${participant.user_id}\\"}'; SELECT count(*) FROM public.get_attempt_gabarito('${attemptId}');"`).toString().trim();
    console.log("📊 Itens no gabarito:", parseInt(resGabarito) > 0 ? "✅ OK" : "❌ FALHA");

  } catch (err) {
    console.error("💥 Erro:", err.message);
  }
}

runSubmitAnswerTest();
