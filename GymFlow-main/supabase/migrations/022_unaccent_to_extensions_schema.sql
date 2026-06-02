-- Move unaccent from public to extensions schema (security best practice)
-- and update generate_academy_slug to qualify the call explicitly.
ALTER EXTENSION unaccent SET SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.generate_academy_slug(name text)
RETURNS text
LANGUAGE plpgsql
AS $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  base_slug := lower(regexp_replace(extensions.unaccent(name), '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;

  while exists (select 1 from academies where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  return final_slug;
end;
$$;
