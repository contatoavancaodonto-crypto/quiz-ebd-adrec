-- Libera Elisamarques (elizamarques390@gmail.com) para realizar o Provão:
-- remove a tentativa abandonada da Lição 12 (finished_at IS NULL) que poderia
-- atrapalhar o fluxo de novas tentativas.
DELETE FROM public.quiz_attempts
WHERE id = 'be4a1b40-02a9-4132-8a4c-c07253a0ce95'
  AND finished_at IS NULL;