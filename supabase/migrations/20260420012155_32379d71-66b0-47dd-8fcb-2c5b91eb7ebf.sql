ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_questions_quiz_active ON public.questions(quiz_id, active);