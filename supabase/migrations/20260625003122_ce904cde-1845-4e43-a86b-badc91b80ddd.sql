CREATE OR REPLACE FUNCTION public.fill_tarif_nominal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.tarif_nominal IS NULL OR NEW.tarif_nominal = 0 THEN
    SELECT tarif INTO NEW.tarif_nominal FROM public.tarif WHERE id = NEW.tarif_id;
    NEW.tarif_nominal := COALESCE(NEW.tarif_nominal, 0);
  END IF;
  RETURN NEW;
END;
$function$;