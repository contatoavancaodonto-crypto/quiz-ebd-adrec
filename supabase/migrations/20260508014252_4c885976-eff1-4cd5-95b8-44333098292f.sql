-- Remove existing constraint
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_status_check;

-- Add updated constraint
ALTER TABLE public.lessons ADD CONSTRAINT lessons_status_check 
CHECK (status = ANY (ARRAY[
  'completo'::text, 
  'incompleto'::text, 
  'AGENDADO'::text, 
  'ARQUIVADO'::text, 
  'COMPLETO SEM AGENDAMENTO'::text, 
  'INCOMPLETO'::text
]));