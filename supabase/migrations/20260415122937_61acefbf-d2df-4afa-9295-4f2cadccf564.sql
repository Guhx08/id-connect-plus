
-- 1. Drop overly permissive SELECT policy on solicitations
DROP POLICY IF EXISTS "Public can view own solicitations by email" ON public.solicitations;

-- 2. Create admin-only SELECT policy
CREATE POLICY "Admins can view all solicitations"
ON public.solicitations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Drop overly permissive INSERT policy
DROP POLICY IF EXISTS "Public can create solicitations" ON public.solicitations;

-- 4. Create restricted INSERT policy (enforce pendente status, no forging response fields)
CREATE POLICY "Public can create solicitations"
ON public.solicitations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pendente'
  AND responded_by IS NULL
  AND responded_at IS NULL
  AND resposta IS NULL
);
