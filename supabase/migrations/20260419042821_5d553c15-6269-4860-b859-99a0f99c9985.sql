DELETE FROM public.quiz_attempts WHERE participant_id IN (SELECT id FROM public.participants WHERE name = 'REALTIME TEST');
DELETE FROM public.quizzes WHERE title = 'RT TEST QUIZ';
UPDATE public.participants SET active = false WHERE name = 'REALTIME TEST';