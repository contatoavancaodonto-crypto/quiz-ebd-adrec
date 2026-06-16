
-- Backfill com cast (lessons.trimester é text, quiz_attempts.trimester é int)
UPDATE public.quiz_attempts qa
   SET trimester = COALESCE(q.trimester, NULLIF(l.trimester, '')::int)
  FROM public.quiz_attempts qa2
  LEFT JOIN public.quizzes q ON q.id = qa2.quiz_id
  LEFT JOIN public.lessons l ON l.id = qa2.lesson_id
 WHERE qa.id = qa2.id
   AND qa.finished_at IS NOT NULL
   AND qa.trimester IS NULL
   AND COALESCE(q.trimester, NULLIF(l.trimester, '')::int) IS NOT NULL;
