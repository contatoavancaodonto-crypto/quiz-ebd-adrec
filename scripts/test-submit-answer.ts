async function runSubmitAnswerTest() {
  console.log("🚀 Iniciando teste da função submit_answer...");
  
  try {
    const { execSync } = require('child_process');

    // 1. Pegar dados via psql diretamente
    console.log("🔍 Buscando dados via psql...");
    const participantJson = execSync(`psql -t -A -c "SELECT json_build_object('id', id, 'user_id', user_id) FROM public.participants WHERE user_id IS NOT NULL LIMIT 1;"`).toString().trim();
    const participant = JSON.parse(participantJson);

    const lessonJson = execSync(`psql -t -A -c "SELECT json_build_object('id', id, 'questions', questions) FROM public.lessons WHERE jsonb_array_length(questions) > 0 LIMIT 1;"`).toString().trim();
    const lesson = JSON.parse(lessonJson);

    if (!participant || !lesson) {
        console.error("❌ Dados não encontrados via psql.");
        return;
    }

    const questions = lesson.questions;
    const testQuestion = questions[0];
    const questionId = testQuestion.id;
    const correctOption = (testQuestion.respostaCorreta || testQuestion.correct_option || 'A').toUpperCase();

    console.log(`👤 Participante: ${participant.id}`);
    console.log(`📝 Lição: ${lesson.id}, Pergunta: ${questionId}, Correta: ${correctOption}`);

    // 2. Criar tentativa
    const attemptId = execSync(`psql -t -A -c "INSERT INTO public.quiz_attempts (participant_id, lesson_id, source_type, total_questions) VALUES ('${participant.id}', '${lesson.id}', 'lesson_json', ${questions.length}) RETURNING id;"`).toString().trim();
    console.log(`✅ Tentativa: ${attemptId}`);

    // 3. Testar submit_answer (Correta)
    console.log("📡 Testando resposta CORRETA...");
    const sqlCorrect = `
      SET LOCAL "request.jwt.claims" = '{"sub": "${participant.user_id}"}';
      SELECT is_correct FROM public.submit_answer('${attemptId}', '${questionId}', '${correctOption}');
    `;
    const resCorrect = execSync(`psql -t -A -c "${sqlCorrect}"`).toString().trim();
    console.log("📊 Resultado:", resCorrect);
    
    if (resCorrect === 't') {
        console.log("✅ SUCESSO: Validou corretamente.");
    } else {
        console.error("❌ FALHA: Não validou a correta.");
    }

    // 4. Testar submit_answer (Incorreta)
    const wrongOption = correctOption === 'A' ? 'B' : 'A';
    console.log(`📡 Testando resposta INCORRETA (${wrongOption})...`);
    const sqlWrong = `
      SET LOCAL "request.jwt.claims" = '{"sub": "${participant.user_id}"}';
      SELECT is_correct FROM public.submit_answer('${attemptId}', '${questionId}', '${wrongOption}');
    `;
    const resWrong = execSync(`psql -t -A -c "${sqlWrong}"`).toString().trim();
    console.log("📊 Resultado:", resWrong);
    
    if (resWrong === 'f') {
        console.log("✅ SUCESSO: Invalidou corretamente.");
    } else {
        console.error("❌ FALHA: Aceitou a incorreta.");
    }

    // 5. Validar Gabarito
    console.log("📡 Testando GABARITO...");
    const sqlGabarito = `
      SET LOCAL "request.jwt.claims" = '{"sub": "${participant.user_id}"}';
      SELECT count(*) FROM public.get_attempt_gabarito('${attemptId}');
    `;
    const resGabarito = execSync(`psql -t -A -c "${sqlGabarito}"`).toString().trim();
    console.log("📊 Itens no gabarito:", resGabarito);
    if (parseInt(resGabarito) > 0) {
        console.log("✅ SUCESSO: Gabarito retornou itens.");
    } else {
        console.error("❌ FALHA: Gabarito vazio.");
    }

  } catch (err) {
    console.error("💥 Erro:", err.message);
  }
}

runSubmitAnswerTest();
