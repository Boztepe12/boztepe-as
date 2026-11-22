-- Supabase her projeye herkese açık bir REST API (PostgREST) kurar ve "public"
-- şemasındaki tablolara "anon" ve "authenticated" rollerine erişim verir. Site o
-- API'yi kullanmaz (veritabanına kendi kullanıcısıyla doğrudan bağlanır); açık
-- kalırsa Supabase'in herkese açık anahtarını bilen biri yönetici şifre
-- özetlerini ve talepleri okuyabilirdi. Bu migrasyon:
--   1. her tabloda satır güvenliğini (RLS) açar — politika yok, yani API'den
--      hiçbir satır görünmez; tablonun sahibi (sitenin kullanıcısı) etkilenmez;
--   2. anon/authenticated rollerinin tablolardaki ve dizilerdeki bütün
--      yetkilerini ve bundan sonra açılacak tablolar için varsayılan yetkilerini
--      kaldırır.
-- Yerelde (PGlite) bu roller yoktur; o kısım atlanır, RLS yine açılır.
-- Yeni bir tablo ekleyen migrasyon da "enable row level security" eklemeli.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated';
  END IF;
END $$;
