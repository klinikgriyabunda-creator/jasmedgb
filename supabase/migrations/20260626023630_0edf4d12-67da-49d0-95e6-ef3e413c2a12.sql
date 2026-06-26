
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, anon;

DROP POLICY IF EXISTS "transaksi insert owner or bidan" ON public.transaksi;
DROP POLICY IF EXISTS "transaksi insert auth" ON public.transaksi;
CREATE POLICY "transaksi insert authenticated" ON public.transaksi
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tb insert auth" ON public.transaksi_bidan;
CREATE POLICY "tb insert authenticated" ON public.transaksi_bidan
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

GRANT SELECT ON public.tarif_public TO authenticated;
GRANT SELECT ON public.transaksi_public TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
