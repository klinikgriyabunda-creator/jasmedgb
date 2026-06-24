
-- Fix has_role EXECUTE permission
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

-- Security-definer helper to check bidan membership without recursive RLS
CREATE OR REPLACE FUNCTION public.is_bidan_of_transaksi(_transaksi_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.transaksi_bidan WHERE transaksi_id = _transaksi_id AND bidan_id = _user_id)
$$;
GRANT EXECUTE ON FUNCTION public.is_bidan_of_transaksi(uuid, uuid) TO authenticated;

-- Replace recursive transaksi_bidan SELECT policy
DROP POLICY IF EXISTS "tb select related" ON public.transaksi_bidan;
CREATE POLICY "tb select related" ON public.transaksi_bidan
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner') 
    OR bidan_id = auth.uid()
    OR public.is_bidan_of_transaksi(transaksi_id, auth.uid())
  );

-- Replace transaksi SELECT policy to use helper too
DROP POLICY IF EXISTS "transaksi select owner all" ON public.transaksi;
CREATE POLICY "transaksi select owner all" ON public.transaksi
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner') 
    OR public.is_bidan_of_transaksi(id, auth.uid())
  );
