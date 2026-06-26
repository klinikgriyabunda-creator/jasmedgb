ALTER TABLE public.transaksi
  ALTER COLUMN created_by SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "transaksi select owner all" ON public.transaksi;

CREATE POLICY "transaksi select owner or related" ON public.transaksi
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner')
    OR created_by = auth.uid()
    OR public.is_bidan_of_transaksi(id, auth.uid())
  );