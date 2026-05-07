-- Add columns for read status and scheduling to academic_comments
ALTER TABLE public.academic_comments 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Create an index for performance on scheduled comments
CREATE INDEX IF NOT EXISTS idx_academic_comments_scheduled_for ON public.academic_comments (scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_academic_comments_is_read ON public.academic_comments (is_read);

-- Update RLS for update and delete
-- Admin and superadmin can already do everything if the current policies are broad enough, 
-- but let's ensure they can update/delete their own comments.

CREATE POLICY "Senders can update their own academic comments" 
ON public.academic_comments 
FOR UPDATE 
USING (auth.uid() = sender_id);

CREATE POLICY "Senders can delete their own academic comments" 
ON public.academic_comments 
FOR DELETE 
USING (auth.uid() = sender_id);

-- Policy for members to mark as read
CREATE POLICY "Recipients can mark comments as read" 
ON public.academic_comments 
FOR UPDATE 
USING (auth.uid() = recipient_id OR type = 'global_collective' OR (type = 'church_collective' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND church_id = academic_comments.church_id
)));
