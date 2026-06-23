
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update fungsi handle_new_user untuk juga isi email
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_nama TEXT;
  v_is_first BOOLEAN;
BEGIN
  v_nama := COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1));
  INSERT INTO public.profiles (id, nama, email) VALUES (NEW.id, v_nama, NEW.email)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'owner') INTO v_is_first;
  IF v_is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Backfill email untuk profil yang sudah ada
UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id AND p.email IS NULL;
