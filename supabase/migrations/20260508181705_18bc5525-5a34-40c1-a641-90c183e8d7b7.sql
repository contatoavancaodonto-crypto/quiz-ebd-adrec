-- 1. Modificar a tabela questions para suportar lições
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE;

ALTER TABLE public.questions 
ALTER COLUMN quiz_id DROP NOT NULL;

-- 2. Modificar a tabela quiz_attempts para suportar lições
ALTER TABLE public.quiz_attempts 
ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_attempts 
ALTER COLUMN quiz_id DROP NOT NULL;

-- Remover a restrição de chave estrangeira antiga se ela for muito rígida (opcional, dependendo do estado atual)
-- No nosso caso, queremos manter, mas permitir nulo se lesson_id estiver presente
ALTER TABLE public.quiz_attempts 
DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_fkey,
ADD CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;

-- 3. Atualizar a função de validação de janela de quiz
CREATE OR REPLACE FUNCTION public.enforce_quiz_window()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
 DECLARE
     v_active BOOLEAN;
     v_opens_at TIMESTAMPTZ;
     v_closes_at TIMESTAMPTZ;
     v_quiz_kind TEXT;
 BEGIN
     -- Se for um quiz tradicional
     IF NEW.quiz_id IS NOT NULL THEN
         SELECT active, opens_at, closes_at, quiz_kind 
         INTO v_active, v_opens_at, v_closes_at, v_quiz_kind
         FROM public.quizzes 
         WHERE id = NEW.quiz_id;
         
         IF v_active IS FALSE THEN
             RAISE EXCEPTION 'Este quiz está desativado pelo administrador.';
         END IF;

         IF v_quiz_kind = 'weekly' AND v_opens_at IS NOT NULL AND v_closes_at IS NOT NULL THEN
             IF NOW() < v_opens_at THEN
                 RAISE EXCEPTION 'Este quiz ainda não está aberto (abre em %).', 
                     to_char(v_opens_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:mi');
             END IF;
             IF NOW() > v_closes_at THEN
                 RAISE EXCEPTION 'Este quiz já está encerrado (encerrou em %).', 
                     to_char(v_closes_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:mi');
             END IF;
         END IF;
     
     -- Se for uma lição agendada
     ELSIF NEW.lesson_id IS NOT NULL THEN
         SELECT 
            (status = 'AGENDADO' OR status = 'COMPLETO SEM AGENDAMENTO'),
            scheduled_date, 
            scheduled_end_date
         INTO v_active, v_opens_at, v_closes_at
         FROM public.lessons 
         WHERE id = NEW.lesson_id;

         IF v_active IS FALSE THEN
             RAISE EXCEPTION 'Esta lição não está ativa ou agendada.';
         END IF;

         IF v_opens_at IS NOT NULL AND v_closes_at IS NOT NULL THEN
             IF NOW() < v_opens_at THEN
                 RAISE EXCEPTION 'Esta lição ainda não está disponível (abre em %).', 
                     to_char(v_opens_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:mi');
             END IF;
             IF NOW() > v_closes_at THEN
                 RAISE EXCEPTION 'Esta lição já encerrou seu período de quiz (encerrou em %).', 
                     to_char(v_closes_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:mi');
             END IF;
         END IF;
     END IF;

     RETURN NEW;
 END;
 $function$;

-- 4. Atualizar a função de submeter resposta
CREATE OR REPLACE FUNCTION public.submit_answer(p_attempt_id uuid, p_question_id text, p_selected_option text)
 RETURNS TABLE(is_correct boolean, correct_option text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
 DECLARE
   v_correct text;
   v_is_correct boolean;
   v_finished timestamptz;
   v_owner uuid;
   v_source_type text;
   v_lesson_id uuid;
   v_questions_json jsonb;
   v_q_json jsonb;
 BEGIN
   IF auth.uid() IS NULL THEN
     RAISE EXCEPTION 'Unauthorized';
   END IF;

   IF UPPER(p_selected_option) NOT IN ('A','B','C','D') THEN
     RAISE EXCEPTION 'Invalid option';
   END IF;

   SELECT qa.finished_at, p.user_id, qa.source_type, COALESCE(qa.lesson_id, qa.quiz_id)
   INTO v_finished, v_owner, v_source_type, v_lesson_id
   FROM public.quiz_attempts qa
   JOIN public.participants p ON p.id = qa.participant_id
   WHERE qa.id = p_attempt_id;

   IF v_owner IS NULL OR v_owner <> auth.uid() THEN
     RAISE EXCEPTION 'Forbidden';
   END IF;

   IF v_finished IS NOT NULL THEN
     RAISE EXCEPTION 'Attempt already finalized';
   END IF;

   -- Tenta buscar primeiro na tabela de perguntas unificada (UUID)
   BEGIN
     SELECT q.correct_option INTO v_correct
     FROM public.questions q
     WHERE q.id = p_question_id::uuid;
   EXCEPTION WHEN OTHERS THEN
     v_correct := NULL;
   END;

   -- Se não achou na tabela (pode ser um ID legado q-0, etc), busca no JSON da lição
   IF v_correct IS NULL AND v_source_type = 'lesson_table' THEN
     SELECT questions INTO v_questions_json FROM public.lessons WHERE id = v_lesson_id;
     
     SELECT value INTO v_q_json
     FROM jsonb_array_elements(v_questions_json) AS value
     WHERE (value->>'id') = p_question_id;

     IF v_q_json IS NULL AND p_question_id LIKE 'q-%' THEN
        v_q_json := v_questions_json->(substring(p_question_id from 3)::int);
     END IF;

     IF v_q_json IS NOT NULL THEN
       v_correct := COALESCE(v_q_json->>'correct_option', v_q_json->>'respostaCorreta', v_q_json->>'correctOption');
     END IF;
   END IF;

   IF v_correct IS NULL THEN
     RAISE EXCEPTION 'Question not found';
   END IF;

   v_is_correct := (UPPER(p_selected_option) = UPPER(v_correct));

   INSERT INTO public.answers (attempt_id, question_id, selected_option, is_correct)
   VALUES (p_attempt_id, p_question_id, UPPER(p_selected_option), v_is_correct)
   ON CONFLICT (attempt_id, question_id) 
   DO UPDATE SET 
     selected_option = EXCLUDED.selected_option,
     is_correct = EXCLUDED.is_correct;

   RETURN QUERY SELECT v_is_correct, v_correct;
 END;
 $function$;
