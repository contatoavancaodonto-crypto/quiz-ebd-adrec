-- Create enum for moderation status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE moderation_status AS ENUM ('approved', 'pending', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add moderation columns to posts
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS status moderation_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS risk_level TEXT,
ADD COLUMN IF NOT EXISTS moderation_reason TEXT;

-- Add moderation columns to post_comments
ALTER TABLE public.post_comments
ADD COLUMN IF NOT EXISTS status moderation_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS risk_level TEXT,
ADD COLUMN IF NOT EXISTS moderation_reason TEXT;

-- Create moderation_logs table
CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL, -- 'post' or 'comment'
    content_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    status moderation_status NOT NULL,
    risk_level TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on moderation_logs
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all logs
CREATE POLICY "Admins can view all moderation logs" 
ON public.moderation_logs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
);

-- Re-configure RLS for posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Posts are viewable by everyone if approved" ON public.posts;

CREATE POLICY "Posts are viewable by everyone if approved" 
ON public.posts 
FOR SELECT 
USING (
    status = 'approved' OR 
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Re-configure RLS for post_comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.post_comments;
DROP POLICY IF EXISTS "Public comments are viewable by everyone" ON public.post_comments;
DROP POLICY IF EXISTS "Comments are viewable by everyone if approved" ON public.post_comments;

CREATE POLICY "Comments are viewable by everyone if approved" 
ON public.post_comments 
FOR SELECT 
USING (
    status = 'approved' OR 
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Ensure default status is 'pending' for new content
ALTER TABLE public.posts ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.post_comments ALTER COLUMN status SET DEFAULT 'pending';
