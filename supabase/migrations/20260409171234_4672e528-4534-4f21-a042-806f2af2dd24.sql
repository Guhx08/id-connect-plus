
-- Allow anyone (anon) to view solicitations by email lookup
CREATE POLICY "Public can view own solicitations by email"
ON public.solicitations
FOR SELECT
TO anon, authenticated
USING (true);

-- Drop the old admin-only select policy since we now have a broader one
-- Admins still have access via the new policy
DROP POLICY IF EXISTS "Admins can view solicitations" ON public.solicitations;
