CREATE TYPE "public"."katalog_tur" AS ENUM('pdf', 'baglanti');--> statement-breakpoint
CREATE TABLE "kataloglar" (
	"id" serial PRIMARY KEY NOT NULL,
	"baslik" varchar(160) NOT NULL,
	"grup" varchar(80),
	"aciklama" text,
	"tur" "katalog_tur" DEFAULT 'pdf' NOT NULL,
	"baglanti" text,
	"dosya_kimligi" text,
	"dosya_adi" varchar(240),
	"dosya_boyutu" integer,
	"kapak_url" text,
	"kapak_kimligi" text,
	"sira" integer DEFAULT 0 NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"olusturma_tarihi" timestamp with time zone DEFAULT now() NOT NULL,
	"guncelleme_tarihi" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "kataloglar_aktif_idx" ON "kataloglar" USING btree ("aktif","sira");