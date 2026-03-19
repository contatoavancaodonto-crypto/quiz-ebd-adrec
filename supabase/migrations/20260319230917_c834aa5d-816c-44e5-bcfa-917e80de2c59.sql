
-- Classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Classes are publicly readable" ON public.classes FOR SELECT USING (true);

-- Participants table
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants are publicly readable" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Anyone can create participants" ON public.participants FOR INSERT WITH CHECK (true);

-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL DEFAULT 13,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quizzes are publicly readable" ON public.quizzes FOR SELECT USING (true);

-- Questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are publicly readable" ON public.questions FOR SELECT USING (true);

-- Quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 13,
  accuracy_percentage NUMERIC NOT NULL DEFAULT 0,
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attempts are publicly readable" ON public.quiz_attempts FOR SELECT USING (true);
CREATE POLICY "Anyone can create attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update attempts" ON public.quiz_attempts FOR UPDATE USING (true);

-- Answers table
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option TEXT NOT NULL CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Answers are publicly readable" ON public.answers FOR SELECT USING (true);
CREATE POLICY "Anyone can create answers" ON public.answers FOR INSERT WITH CHECK (true);

-- Ranking by class view
CREATE OR REPLACE VIEW public.ranking_by_class AS
SELECT
  p.name AS participant_name,
  c.name AS class_name,
  c.id AS class_id,
  qa.score,
  qa.total_time_seconds,
  qa.accuracy_percentage,
  qa.id AS attempt_id,
  qa.finished_at,
  ROW_NUMBER() OVER (
    PARTITION BY c.id
    ORDER BY qa.score DESC, qa.total_time_seconds ASC
  ) AS position
FROM public.quiz_attempts qa
JOIN public.participants p ON qa.participant_id = p.id
JOIN public.classes c ON p.class_id = c.id
WHERE qa.finished_at IS NOT NULL;

-- Ranking general view
CREATE OR REPLACE VIEW public.ranking_general AS
SELECT
  p.name AS participant_name,
  c.name AS class_name,
  c.id AS class_id,
  qa.score,
  qa.total_time_seconds,
  qa.accuracy_percentage,
  qa.id AS attempt_id,
  qa.finished_at,
  ROW_NUMBER() OVER (
    ORDER BY qa.score DESC, qa.total_time_seconds ASC
  ) AS position
FROM public.quiz_attempts qa
JOIN public.participants p ON qa.participant_id = p.id
JOIN public.classes c ON p.class_id = c.id
WHERE qa.finished_at IS NOT NULL;

-- Seed classes
INSERT INTO public.classes (name) VALUES ('Adultos'), ('Jovens'), ('Adolescentes');
