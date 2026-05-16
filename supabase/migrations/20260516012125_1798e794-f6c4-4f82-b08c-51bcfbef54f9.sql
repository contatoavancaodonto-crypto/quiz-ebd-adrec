-- First, ensure there are no orphaned user_ids in participants that don't exist in profiles
-- (This is unlikely but good to handle)
UPDATE public.participants p
SET user_id = NULL
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public.profiles prof WHERE prof.id = p.user_id);

-- Add the foreign key constraint
ALTER TABLE public.participants
ADD CONSTRAINT participants_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Enable RLS for the join to work correctly if needed
-- (Already enabled and set to true, so we are good)
