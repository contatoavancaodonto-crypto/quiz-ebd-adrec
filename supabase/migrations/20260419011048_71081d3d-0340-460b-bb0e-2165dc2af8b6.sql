-- Allow public UPDATE on seasons (admin panel uses double-confirmation in UI)
CREATE POLICY "Anyone can update seasons"
ON public.seasons
FOR UPDATE
USING (true)
WITH CHECK (true);