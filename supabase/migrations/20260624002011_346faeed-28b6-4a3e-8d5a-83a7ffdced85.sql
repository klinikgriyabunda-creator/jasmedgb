
GRANT SELECT ON public.tarif_public TO authenticated;
GRANT SELECT ON public.transaksi_public TO authenticated;

ALTER TABLE public.tarif ALTER COLUMN created_by SET DEFAULT auth.uid();

CREATE POLICY "tarif select own creation"
  ON public.tarif FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());
