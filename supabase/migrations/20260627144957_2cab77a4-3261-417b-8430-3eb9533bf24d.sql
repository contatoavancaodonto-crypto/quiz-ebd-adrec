GRANT SELECT ON public.classes TO anon, authenticated;
GRANT SELECT ON public.seasons TO anon, authenticated;
GRANT SELECT ON public.quizzes TO authenticated;
GRANT SELECT ON public.lessons TO authenticated;
GRANT SELECT ON public.questions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.quiz_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.answers TO authenticated;

GRANT ALL ON public.classes TO service_role;
GRANT ALL ON public.seasons TO service_role;
GRANT ALL ON public.quizzes TO service_role;
GRANT ALL ON public.lessons TO service_role;
GRANT ALL ON public.questions TO service_role;
GRANT ALL ON public.participants TO service_role;
GRANT ALL ON public.quiz_attempts TO service_role;
GRANT ALL ON public.answers TO service_role;