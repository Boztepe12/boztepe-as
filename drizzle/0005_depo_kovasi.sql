-- Dosya deposu: Supabase Storage'da herkese açık "site" kovası (görseller ve PDF
-- kataloglar; lib/storage/supabase.ts). Supabase'in kendisi uygular: yalnız bu
-- türler, dosya başına 50 MB. Okuma herkese açık (vitrin), yazma yalnız sunucunun
-- gizli anahtarıyla — kovaya anon/authenticated için hiçbir yazma politikası yok.
-- Yerelde (PGlite) "storage" şeması yoktur; bu migrasyon bir şey yapmaz.
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('site', 'site', true, 52428800,
            ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'application/pdf'])
    ON CONFLICT (id) DO UPDATE
      SET public = true, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;
