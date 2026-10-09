CREATE TABLE "stok_entegrasyonu" (
	"id" integer PRIMARY KEY NOT NULL,
	"son_imlec" text,
	"son_esitleme" timestamp with time zone,
	"son_sonuc" jsonb,
	"son_hata" text,
	"son_hata_tarihi" timestamp with time zone,
	"yeni_urunleri_yayinla" boolean DEFAULT false NOT NULL,
	"guncelleme_tarihi" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "urunler" ADD COLUMN "stok_barkod" varchar(64);--> statement-breakpoint
ALTER TABLE "urunler" ADD COLUMN "stok_urun_id" varchar(40);--> statement-breakpoint
ALTER TABLE "urunler" ADD COLUMN "stok_miktari" numeric(12, 3);--> statement-breakpoint
ALTER TABLE "urunler" ADD COLUMN "stok_liste_fiyati" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "urunler" ADD COLUMN "fiyat_stoktan" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "urunler" ADD COLUMN "stok_durumu_stoktan" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "urunler" ADD COLUMN "stok_kaldirildi" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "urunler" ADD COLUMN "stok_esitleme_tarihi" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "urunler_stok_barkod_idx" ON "urunler" USING btree ("stok_barkod");