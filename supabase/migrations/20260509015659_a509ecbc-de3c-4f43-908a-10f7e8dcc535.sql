-- Create favorite_verses table
CREATE TABLE public.favorite_verses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_name TEXT NOT NULL,
    book_abbrev TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    verse_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, book_abbrev, chapter, verse_number)
);

-- Enable RLS
ALTER TABLE public.favorite_verses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own favorite verses"
ON public.favorite_verses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite verses"
ON public.favorite_verses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite verses"
ON public.favorite_verses
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_favorite_verses_user_id ON public.favorite_verses(user_id);
