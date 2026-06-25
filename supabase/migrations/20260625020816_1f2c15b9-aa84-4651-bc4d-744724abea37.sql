
-- 1) Tambah kolom partner bidan
ALTER TABLE public.transaksi
  ADD COLUMN IF NOT EXISTS bidan_partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2) Perketat policy insert transaksi: owner ATAU bidan
DROP POLICY IF EXISTS "transaksi insert auth" ON public.transaksi;
CREATE POLICY "transaksi insert owner or bidan" ON public.transaksi
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'bidan'::app_role)
  );

-- 3) Tabel tarif_pending
CREATE TABLE IF NOT EXISTS public.tarif_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'Lainnya',
  tarif NUMERIC(12,2) NOT NULL DEFAULT 0,
  bidan_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  bidan_nama TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarif_pending TO authenticated;
GRANT ALL ON public.tarif_pending TO service_role;

ALTER TABLE public.tarif_pending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tp select owner or own" ON public.tarif_pending
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::app_role)
    OR bidan_id = auth.uid()
  );

CREATE POLICY "tp insert bidan" ON public.tarif_pending
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'bidan'::app_role)
    AND bidan_id = auth.uid()
  );

CREATE POLICY "tp update owner" ON public.tarif_pending
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "tp delete owner" ON public.tarif_pending
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER trg_tarif_pending_updated
  BEFORE UPDATE ON public.tarif_pending
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
