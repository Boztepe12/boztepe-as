CREATE TYPE "public"."stok_durumu" AS ENUM('stokta', 'tukendi', 'siparise_bagli');--> statement-breakpoint
CREATE TYPE "public"."talep_durumu" AS ENUM('yeni', 'arandi', 'teklif_verildi', 'satisa_donustu', 'iptal');--> statement-breakpoint
CREATE TYPE "public"."yonetici_rol" AS ENUM('admin', 'editor');--> statement-breakpoint
CREATE TABLE "afisler" (
	"id" serial PRIMARY KEY NOT NULL,
	"baslik" varchar(200) NOT NULL,
	"alt_baslik" varchar(300),
	"gorsel_url" text,
	"gorsel_kimligi" text,
	"mobil_gorsel_url" text,
	"mobil_gorsel_kimligi" text,
	"baglanti" text,
	"buton_metni" varchar(80),
	"sira" integer DEFAULT 0 NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"baslangic_tarihi" timestamp with time zone,
	"bitis_tarihi" timestamp with time zone,
	"olusturma_tarihi" timestamp with time zone DEFAULT now() NOT NULL,
	"guncelleme_tarihi" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ayarlar" (
	"anahtar" varchar(80) PRIMARY KEY NOT NULL,
	"deger" jsonb NOT NULL,
	"guncelleme_tarihi" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banka_hesaplari" (
	"id" serial PRIMARY KEY NOT NULL,
	"banka_adi" varchar(120) NOT NULL,
	"hesap_sahibi" varchar(200) NOT NULL,
	"iban" varchar(40) NOT NULL,
	"sube" varchar(120),
	"sira" integer DEFAULT 0 NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"olusturma_tarihi" timestamp with time zone DEFAULT now() NOT NULL,
	"guncelleme_tarihi" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "galeri_gorselleri" (
	"id" serial PRIMARY KEY NOT NULL,
	"baslik" varchar(200),
	"url" text NOT NULL,
	"depo_kimligi" text,
	"sira" integer DEFAULT 0 NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"olusturma_tarihi" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kategoriler" (
	"id" serial PRIMARY KEY NOT NULL,
	"ad" varchar(160) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"aciklama" text,
	"ust_kategori_id" integer,
	"gorsel_url" text,
	"gorsel_kimligi" text,
	"sira" integer DEFAULT 0 NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"ana_sayfada_goster" boolean DEFAULT false NOT NULL,
	"seo_baslik" varchar(200),
	"seo_aciklama" text,
	"olusturma_tarihi" timestamp with time zone DEFAULT now() NOT NULL,
	"guncelleme_tarihi" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markalar" (
	"id" serial PRIMARY KEY NOT NULL,
	"ad" varchar(160) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"logo_url" text,
	"logo_kimligi" text,
	"aciklama" text,
	"sira" integer DEFAULT 0 NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"olusturma_tarihi" timestamp with time zone DEFAULT now() NOT NULL,
	"guncelleme_tarihi" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talep_kalemleri" (
	"id" serial PRIMARY KEY NOT NULL,
	"talep_id" integer NOT NULL,
	"urun_id" integer,
	"urun_adi" varchar(240) NOT NULL,
	"urun_slug" varchar(260),
	"birim_fiyat" numeric(12, 2),
	"adet" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talepler" (
	"id" serial PRIMARY KEY NOT NULL,
	"kod" varchar(24) NOT NULL,
	"ad_soyad" varchar(160) NOT NULL,
	"telefon" varchar(32) NOT NULL,
	"eposta" varchar(255),
	"mesaj" text,
	"durum" "talep_durumu" DEFAULT 'yeni' NOT NULL,
	"yonetici_notu" text,
	"toplam_tutar" numeric(12, 2),
	"olusturma_tarihi" timestamp with time zone DEFAULT now() NOT NULL,
	"guncelleme_tarihi" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "urun_gorselleri" (
	"id" serial PRIMARY KEY NOT NULL,
	"urun_id" integer NOT NULL,
	"url" text NOT NULL,
	"depo_kimligi" text,
	"alt_metin" varchar(240),
	"sira" integer DEFAULT 0 NOT NULL,
	"olusturma_tarihi" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "urun_ozellikleri" (
	"id" serial PRIMARY KEY NOT NULL,
	"urun_id" integer NOT NULL,
	"ad" varchar(120) NOT NULL,
	"deger" varchar(240) NOT NULL,
	"sira" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "urunler" (
	"id" serial PRIMARY KEY NOT NULL,
	"ad" varchar(240) NOT NULL,
	"slug" varchar(260) NOT NULL,
	"stok_kodu" varchar(80),
	"kategori_id" integer,
	"marka_id" integer,
	"kisa_aciklama" text,
	"aciklama" text,
	"fiyat" numeric(12, 2),
	"indirimli_fiyat" numeric(12, 2),
	"fiyat_gizli" boolean DEFAULT false NOT NULL,
	"taksit_sayisi" integer,
	"garanti_suresi" varchar(80),
	"stok_durumu" "stok_durumu" DEFAULT 'stokta' NOT NULL,
	"one_cikan" boolean DEFAULT false NOT NULL,
	"yeni_urun" boolean DEFAULT false NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"sira" integer DEFAULT 0 NOT NULL,
	"goruntulenme" integer DEFAULT 0 NOT NULL,
	"seo_baslik" varchar(200),
	"seo_aciklama" text,
	"arama_metni" text,
	"olusturma_tarihi" timestamp with time zone DEFAULT now() NOT NULL,
	"guncelleme_tarihi" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yoneticiler" (
	"id" serial PRIMARY KEY NOT NULL,
	"eposta" varchar(255) NOT NULL,
	"sifre_ozeti" text NOT NULL,
	"ad_soyad" varchar(120) NOT NULL,
	"rol" "yonetici_rol" DEFAULT 'editor' NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"son_giris_tarihi" timestamp with time zone,
	"olusturma_tarihi" timestamp with time zone DEFAULT now() NOT NULL,
	"guncelleme_tarihi" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "talep_kalemleri" ADD CONSTRAINT "talep_kalemleri_talep_id_talepler_id_fk" FOREIGN KEY ("talep_id") REFERENCES "public"."talepler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep_kalemleri" ADD CONSTRAINT "talep_kalemleri_urun_id_urunler_id_fk" FOREIGN KEY ("urun_id") REFERENCES "public"."urunler"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "urun_gorselleri" ADD CONSTRAINT "urun_gorselleri_urun_id_urunler_id_fk" FOREIGN KEY ("urun_id") REFERENCES "public"."urunler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "urun_ozellikleri" ADD CONSTRAINT "urun_ozellikleri_urun_id_urunler_id_fk" FOREIGN KEY ("urun_id") REFERENCES "public"."urunler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "urunler" ADD CONSTRAINT "urunler_kategori_id_kategoriler_id_fk" FOREIGN KEY ("kategori_id") REFERENCES "public"."kategoriler"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "urunler" ADD CONSTRAINT "urunler_marka_id_markalar_id_fk" FOREIGN KEY ("marka_id") REFERENCES "public"."markalar"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "kategoriler_slug_idx" ON "kategoriler" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "kategoriler_ust_idx" ON "kategoriler" USING btree ("ust_kategori_id");--> statement-breakpoint
CREATE UNIQUE INDEX "markalar_slug_idx" ON "markalar" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "talep_kalemleri_talep_idx" ON "talep_kalemleri" USING btree ("talep_id");--> statement-breakpoint
CREATE UNIQUE INDEX "talepler_kod_idx" ON "talepler" USING btree ("kod");--> statement-breakpoint
CREATE INDEX "talepler_durum_idx" ON "talepler" USING btree ("durum");--> statement-breakpoint
CREATE INDEX "urun_gorselleri_urun_idx" ON "urun_gorselleri" USING btree ("urun_id");--> statement-breakpoint
CREATE INDEX "urun_ozellikleri_urun_idx" ON "urun_ozellikleri" USING btree ("urun_id");--> statement-breakpoint
CREATE UNIQUE INDEX "urunler_slug_idx" ON "urunler" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "urunler_kategori_idx" ON "urunler" USING btree ("kategori_id");--> statement-breakpoint
CREATE INDEX "urunler_marka_idx" ON "urunler" USING btree ("marka_id");--> statement-breakpoint
CREATE INDEX "urunler_aktif_idx" ON "urunler" USING btree ("aktif");--> statement-breakpoint
CREATE INDEX "urunler_one_cikan_idx" ON "urunler" USING btree ("one_cikan");--> statement-breakpoint
CREATE UNIQUE INDEX "yoneticiler_eposta_idx" ON "yoneticiler" USING btree ("eposta");