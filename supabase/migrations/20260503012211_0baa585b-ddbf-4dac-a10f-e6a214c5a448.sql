-- Add class_id and trimester columns to verses table
ALTER TABLE public.verses 
ADD COLUMN class_id UUID REFERENCES public.classes(id),
ADD COLUMN trimester INTEGER;

-- Add index for better performance on filters
CREATE INDEX idx_verses_class_id ON public.verses(class_id);
CREATE INDEX idx_verses_trimester ON public.verses(trimester);
