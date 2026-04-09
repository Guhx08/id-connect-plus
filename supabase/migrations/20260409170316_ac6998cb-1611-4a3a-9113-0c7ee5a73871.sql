
DROP POLICY "Anyone can create solicitations" ON public.solicitations;
CREATE POLICY "Public can create solicitations" ON public.solicitations FOR INSERT TO anon, authenticated WITH CHECK (true);
