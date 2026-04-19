-- Table for class materials (revistas)
CREATE TABLE IF NOT EXISTS public.class_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  trimester INTEGER NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (class_id, trimester, year)
);

ALTER TABLE public.class_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class materials are publicly readable"
  ON public.class_materials FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert class materials"
  ON public.class_materials FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update class materials"
  ON public.class_materials FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete class materials"
  ON public.class_materials FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_class_materials_updated_at
  BEFORE UPDATE ON public.class_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('class-materials', 'class-materials', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Class material PDFs are publicly accessible" ON storage.objects;
CREATE POLICY "Class material PDFs are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'class-materials');

DROP POLICY IF EXISTS "Authenticated can upload class materials" ON storage.objects;
CREATE POLICY "Authenticated can upload class materials"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'class-materials');

DROP POLICY IF EXISTS "Authenticated can update class materials" ON storage.objects;
CREATE POLICY "Authenticated can update class materials"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'class-materials');

DROP POLICY IF EXISTS "Authenticated can delete class materials" ON storage.objects;
CREATE POLICY "Authenticated can delete class materials"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'class-materials');