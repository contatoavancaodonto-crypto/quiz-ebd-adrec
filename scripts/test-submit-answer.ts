async function runSubmitAnswerTest() {
  console.log("🚀 Iniciando teste da função submit_answer...");
  
  try {
    const { execSync } = require('child_process');

    console.log("🔍 Buscando dados...");
    const participantJson = execSync(`psql -t -A -c "SELECT json_build_object('id', id, 'user_id', user_id) FROM public.participants WHERE user_id IS NOT NULL LIMIT 1;"`).toString().trim();
    const participant = JSON.parse(participantJson);

    // Buscar lição e GARANTIR que a data de encerramento seja no futuro para o teste
    const lessonId = 'd6339eef-e8a4-4094-a975-5455d0693232';

    const lessonJson = execSync(`psql -t -A -c "SELECT json_build_object('id', id, 'questions', questions) FROM public.lessons WHERE id = '${lessonId}';"`).toString().trim();
    const lesson = JSON.parse(lessonJson);

    const questions = lesson.questions;
    const testQuestion = questions[0];
    const questionId = testQuestion.id;
    const correctOption = (testQuestion.respostaCorreta || testQuestion.correct_option || 'A').toUpperCase();

    // 2. Criar tentativa
    const attemptId = execSync(`psql -t -A -c "INSERT INTO public.quiz_attempts (participant_id, lesson_id, source_type, total_questions) VALUES ('${participant.id}', '${lesson.id}', 'lesson_json', ${questions.length}) RETURNING id;"`).toString().trim();
    console.log(`✅ Tentativa: ${attemptId}`);

    // 3. Testar submit_answer (Correta)
    const sqlCorrect = `
      SET LOCAL "request.jwt.claims" = '{"sub": "${participant.user_id}"}';
      SELECT is_correct FROM public.submit_answer('${attemptId}', '${questionId}', '${correctOption}');
    `;
    const resCorrect = execSync(`psql -t -A -c "${sqlCorrect}"`).toString().trim();
    console.log("📊 Resposta Correta:", resCorrect === 't' ? "✅ SUCESSO" : "❌ FALHA");

    // 4. Testar submit_answer (Incorreta)
    const wrongOption = correctOption === 'A' ? 'B' : 'A';
    const sqlWrong = `
      SET LOCAL "request.jwt.claims" = '{"sub": "${participant.user_id}"}';
      SELECT is_correct FROM public.submit_answer('${attemptId}', '${questionId}', '${wrongOption}');
    `;
    const resWrong = execSync(`psql -t -A -c "${sqlWrong}"`).toString().trim();
    console.log("📊 Resposta Incorreta:", resWrong === 'f' ? "✅ SUCESSO" : "❌ FALHA");

    // 5. Validar Gabarito
    const sqlGabarito = `
      SET LOCAL "request.jwt.claims" = '{"sub": "${participant.user_id}"}';
      SELECT count(*) FROM public.get_attempt_gabarito('${attemptId}');
    `;
    const resGabarito = execSync(`psql -t -A -c "${sqlGabarito}"`).toString().trim();
    console.log("📊 Itens no gabarito:", parseInt(resGabarito) > 0 ? "✅ OK" : "❌ FALHA");

    // Restaurar data da lição

  } catch (err) {
    console.error("💥 Erro:", err.message);
  }
}

runSubmitAnswerTest();
