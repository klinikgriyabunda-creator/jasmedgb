
-- ============ ENUM & ROLES ============
CREATE TYPE public.app_role AS ENUM ('owner', 'bidan');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ TARIF ============
CREATE TABLE public.tarif (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'Lainnya',
  tarif NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarif TO authenticated;
GRANT ALL ON public.tarif TO service_role;
ALTER TABLE public.tarif ENABLE ROW LEVEL SECURITY;

-- ============ TRANSAKSI ============
CREATE TABLE public.transaksi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  tarif_id UUID NOT NULL REFERENCES public.tarif(id) ON DELETE RESTRICT,
  jumlah INT NOT NULL DEFAULT 1 CHECK (jumlah > 0),
  tarif_nominal NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  catatan TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaksi TO authenticated;
GRANT ALL ON public.transaksi TO service_role;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;

-- ============ TRANSAKSI_BIDAN (1-2 bidan per transaksi) ============
CREATE TABLE public.transaksi_bidan (
  transaksi_id UUID NOT NULL REFERENCES public.transaksi(id) ON DELETE CASCADE,
  bidan_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (transaksi_id, bidan_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaksi_bidan TO authenticated;
GRANT ALL ON public.transaksi_bidan TO service_role;
ALTER TABLE public.transaksi_bidan ENABLE ROW LEVEL SECURITY;

-- ============ VIEWS (tanpa harga, untuk bidan) ============
CREATE VIEW public.tarif_public WITH (security_invoker=on) AS
  SELECT id, nama, kategori, created_at FROM public.tarif;
GRANT SELECT ON public.tarif_public TO authenticated;

CREATE VIEW public.transaksi_public WITH (security_invoker=on) AS
  SELECT id, tanggal, tarif_id, jumlah, catatan, created_by, created_at FROM public.transaksi;
GRANT SELECT ON public.transaksi_public TO authenticated;

-- ============ POLICIES: profiles ============
CREATE POLICY "profiles select all authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own or owner" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "profiles owner insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR id = auth.uid());
CREATE POLICY "profiles owner delete" ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- ============ POLICIES: user_roles ============
CREATE POLICY "user_roles select self or owner" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "user_roles owner manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- ============ POLICIES: tarif ============
-- Base table SELECT: ONLY owner (sembunyikan kolom tarif dari bidan)
CREATE POLICY "tarif select owner only" ON public.tarif FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
-- Bidan & owner boleh insert nama jasa baru
CREATE POLICY "tarif insert authenticated" ON public.tarif FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
-- Hanya owner update/delete
CREATE POLICY "tarif update owner" ON public.tarif FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "tarif delete owner" ON public.tarif FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- ============ POLICIES: transaksi ============
-- Owner lihat semua; bidan lihat yang dia ikut kerjakan (tapi base table tetap berisi tarif_nominal — view-nya yang dipakai bidan)
CREATE POLICY "transaksi select owner all" ON public.transaksi FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner')
    OR EXISTS (
      SELECT 1 FROM public.transaksi_bidan tb
      WHERE tb.transaksi_id = transaksi.id AND tb.bidan_id = auth.uid()
    )
  );
-- Bidan & owner boleh input
CREATE POLICY "transaksi insert auth" ON public.transaksi FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
-- Hanya owner update/delete
CREATE POLICY "transaksi update owner" ON public.transaksi FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "transaksi delete owner" ON public.transaksi FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- ============ POLICIES: transaksi_bidan ============
CREATE POLICY "tb select related" ON public.transaksi_bidan FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner')
    OR bidan_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.transaksi_bidan tb2
      WHERE tb2.transaksi_id = transaksi_bidan.transaksi_id AND tb2.bidan_id = auth.uid()
    )
  );
CREATE POLICY "tb insert auth" ON public.transaksi_bidan FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tb manage owner" ON public.transaksi_bidan FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_tarif_updated BEFORE UPDATE ON public.tarif FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_transaksi_updated BEFORE UPDATE ON public.transaksi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto subtotal
CREATE OR REPLACE FUNCTION public.calc_transaksi_subtotal() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.subtotal := COALESCE(NEW.tarif_nominal,0) * COALESCE(NEW.jumlah,0);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_transaksi_subtotal BEFORE INSERT OR UPDATE ON public.transaksi
  FOR EACH ROW EXECUTE FUNCTION public.calc_transaksi_subtotal();

-- Auto isi tarif_nominal dari master saat insert (jika tidak diisi)
CREATE OR REPLACE FUNCTION public.fill_tarif_nominal() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.tarif_nominal IS NULL OR NEW.tarif_nominal = 0 THEN
    SELECT tarif INTO NEW.tarif_nominal FROM public.tarif WHERE id = NEW.tarif_id;
    NEW.tarif_nominal := COALESCE(NEW.tarif_nominal, 0);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_transaksi_fill_tarif BEFORE INSERT ON public.transaksi
  FOR EACH ROW EXECUTE FUNCTION public.fill_tarif_nominal();

-- Saat master tarif diupdate, propagate ke transaksi yang nominalnya masih 0
CREATE OR REPLACE FUNCTION public.propagate_tarif_update() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.tarif <> OLD.tarif THEN
    UPDATE public.transaksi
      SET tarif_nominal = NEW.tarif
      WHERE tarif_id = NEW.id AND (tarif_nominal = 0 OR tarif_nominal = OLD.tarif);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_tarif_propagate AFTER UPDATE ON public.tarif
  FOR EACH ROW EXECUTE FUNCTION public.propagate_tarif_update();

-- ============ Auto profile + bootstrap owner ============
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_nama TEXT;
  v_is_first BOOLEAN;
BEGIN
  v_nama := COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1));
  INSERT INTO public.profiles (id, nama) VALUES (NEW.id, v_nama)
    ON CONFLICT (id) DO NOTHING;

  -- First signup → owner
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'owner') INTO v_is_first;
  IF v_is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SEED master tarif ============
INSERT INTO public.tarif (nama, kategori, tarif) VALUES
  ('Persalinan Normal', 'Persalinan', 500000),
  ('Pemeriksaan ANC', 'Pemeriksaan', 50000),
  ('Imunisasi Bayi', 'Imunisasi', 35000),
  ('KB Suntik 1 Bulan', 'KB', 30000),
  ('KB Suntik 3 Bulan', 'KB', 35000),
  ('Pemasangan IUD', 'KB', 250000),
  ('Pelepasan IUD', 'KB', 150000),
  ('Pemasangan Implan', 'KB', 200000),
  ('Konsultasi Kehamilan', 'Konsultasi', 40000),
  ('Tindik Bayi', 'Lainnya', 50000);
