ALTER TABLE "kategoriler" ADD COLUMN "stok_kategori_id" varchar(64);--> statement-breakpoint
ALTER TABLE "urunler" ADD COLUMN "stok_onceki_aktif" boolean;--> statement-breakpoint
CREATE UNIQUE INDEX "kategoriler_stok_kategori_idx" ON "kategoriler" USING btree ("stok_kategori_id");