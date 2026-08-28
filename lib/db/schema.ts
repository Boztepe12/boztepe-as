import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Ortak alanlar                                                       */
/* ------------------------------------------------------------------ */

const zamanDamgalari = {
  olusturmaTarihi: timestamp("olusturma_tarihi", { withTimezone: true }).defaultNow().notNull(),
  guncellemeTarihi: timestamp("guncelleme_tarihi", { withTimezone: true }).defaultNow().notNull(),
};

/* ------------------------------------------------------------------ */
/* Sabit deger kumeleri                                                */
/* ------------------------------------------------------------------ */

export const stokDurumuEnum = pgEnum("stok_durumu", [
  "stokta", // Magazada hazir
  "tukendi", // Su an yok
  "siparise_bagli", // Siparis uzerine getiriliyor
]);

export const talepDurumuEnum = pgEnum("talep_durumu", [
  "yeni",
  "arandi",
  "teklif_verildi",
  "satisa_donustu",
  "iptal",
]);

export const yoneticiRolEnum = pgEnum("yonetici_rol", ["admin", "editor"]);

/* ------------------------------------------------------------------ */
/* Yoneticiler                                                         */
/* ------------------------------------------------------------------ */

export const yoneticiler = pgTable(
  "yoneticiler",
  {
    id: serial("id").primaryKey(),
    eposta: varchar("eposta", { length: 255 }).notNull(),
    sifreOzeti: text("sifre_ozeti").notNull(),
    adSoyad: varchar("ad_soyad", { length: 120 }).notNull(),
    rol: yoneticiRolEnum("rol").default("editor").notNull(),
    aktif: boolean("aktif").default(true).notNull(),
    sonGirisTarihi: timestamp("son_giris_tarihi", { withTimezone: true }),
    ...zamanDamgalari,
  },
  (t) => [uniqueIndex("yoneticiler_eposta_idx").on(t.eposta)],
);

/* ------------------------------------------------------------------ */
/* Kategoriler - kendi kendine referansli, iki seviyeli                */
/* ------------------------------------------------------------------ */

export const kategoriler = pgTable(
  "kategoriler",
  {
    id: serial("id").primaryKey(),
    ad: varchar("ad", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    aciklama: text("aciklama"),
    ustKategoriId: integer("ust_kategori_id"),
    gorselUrl: text("gorsel_url"),
    gorselKimligi: text("gorsel_kimligi"),
    sira: integer("sira").default(0).notNull(),
    aktif: boolean("aktif").default(true).notNull(),
    anaSayfadaGoster: boolean("ana_sayfada_goster").default(false).notNull(),
    seoBaslik: varchar("seo_baslik", { length: 200 }),
    seoAciklama: text("seo_aciklama"),
    ...zamanDamgalari,
  },
  (t) => [
    uniqueIndex("kategoriler_slug_idx").on(t.slug),
    index("kategoriler_ust_idx").on(t.ustKategoriId),
  ],
);

/* ------------------------------------------------------------------ */
/* Markalar                                                            */
/* ------------------------------------------------------------------ */

export const markalar = pgTable(
  "markalar",
  {
    id: serial("id").primaryKey(),
    ad: varchar("ad", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    logoUrl: text("logo_url"),
    logoKimligi: text("logo_kimligi"),
    aciklama: text("aciklama"),
    sira: integer("sira").default(0).notNull(),
    aktif: boolean("aktif").default(true).notNull(),
    ...zamanDamgalari,
  },
  (t) => [uniqueIndex("markalar_slug_idx").on(t.slug)],
);

/* ------------------------------------------------------------------ */
/* Urunler                                                             */
/* ------------------------------------------------------------------ */

export const urunler = pgTable(
  "urunler",
  {
    id: serial("id").primaryKey(),
    ad: varchar("ad", { length: 240 }).notNull(),
    slug: varchar("slug", { length: 260 }).notNull(),
    stokKodu: varchar("stok_kodu", { length: 80 }),

    kategoriId: integer("kategori_id").references(() => kategoriler.id, { onDelete: "set null" }),
    markaId: integer("marka_id").references(() => markalar.id, { onDelete: "set null" }),

    kisaAciklama: text("kisa_aciklama"),
    aciklama: text("aciklama"),

    /* Para alanlari numeric - kayan noktali sayi kurus hatasi uretir. */
    fiyat: numeric("fiyat", { precision: 12, scale: 2 }),
    indirimliFiyat: numeric("indirimli_fiyat", { precision: 12, scale: 2 }),
    fiyatGizli: boolean("fiyat_gizli").default(false).notNull(),

    taksitSayisi: integer("taksit_sayisi"),
    garantiSuresi: varchar("garanti_suresi", { length: 80 }),

    stokDurumu: stokDurumuEnum("stok_durumu").default("stokta").notNull(),

    oneCikan: boolean("one_cikan").default(false).notNull(),
    yeniUrun: boolean("yeni_urun").default(false).notNull(),
    aktif: boolean("aktif").default(true).notNull(),

    sira: integer("sira").default(0).notNull(),
    goruntulenme: integer("goruntulenme").default(0).notNull(),

    seoBaslik: varchar("seo_baslik", { length: 200 }),
    seoAciklama: text("seo_aciklama"),

    /*
     * Urun adi, marka, kategori ve stok kodu Turkce karakterlerden arindirilip
     * burada birlestirilir. Arama bu tek sutun uzerinden yapilir; boylece
     * "camasir" yazan da "CAMASIR" yazan da "Camasir Makinesi" urununu bulur.
     */
    aramaMetni: text("arama_metni"),

    ...zamanDamgalari,
  },
  (t) => [
    uniqueIndex("urunler_slug_idx").on(t.slug),
    index("urunler_kategori_idx").on(t.kategoriId),
    index("urunler_marka_idx").on(t.markaId),
    index("urunler_aktif_idx").on(t.aktif),
    index("urunler_one_cikan_idx").on(t.oneCikan),
  ],
);

/* ------------------------------------------------------------------ */
/* Urun gorselleri                                                     */
/* ------------------------------------------------------------------ */

export const urunGorselleri = pgTable(
  "urun_gorselleri",
  {
    id: serial("id").primaryKey(),
    urunId: integer("urun_id")
      .notNull()
      .references(() => urunler.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    depoKimligi: text("depo_kimligi"),
    altMetin: varchar("alt_metin", { length: 240 }),
    sira: integer("sira").default(0).notNull(),
    olusturmaTarihi: timestamp("olusturma_tarihi", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("urun_gorselleri_urun_idx").on(t.urunId)],
);

/* ------------------------------------------------------------------ */
/* Urun ozellikleri - serbest ad/deger, her urun tipine uyar           */
/* ------------------------------------------------------------------ */

export const urunOzellikleri = pgTable(
  "urun_ozellikleri",
  {
    id: serial("id").primaryKey(),
    urunId: integer("urun_id")
      .notNull()
      .references(() => urunler.id, { onDelete: "cascade" }),
    ad: varchar("ad", { length: 120 }).notNull(),
    deger: varchar("deger", { length: 240 }).notNull(),
    sira: integer("sira").default(0).notNull(),
  },
  (t) => [index("urun_ozellikleri_urun_idx").on(t.urunId)],
);

/* ------------------------------------------------------------------ */
/* Ana sayfa afisleri / kampanyalar                                    */
/* ------------------------------------------------------------------ */

export const afisler = pgTable("afisler", {
  id: serial("id").primaryKey(),
  baslik: varchar("baslik", { length: 200 }).notNull(),
  altBaslik: varchar("alt_baslik", { length: 300 }),
  gorselUrl: text("gorsel_url"),
  gorselKimligi: text("gorsel_kimligi"),
  mobilGorselUrl: text("mobil_gorsel_url"),
  mobilGorselKimligi: text("mobil_gorsel_kimligi"),
  baglanti: text("baglanti"),
  butonMetni: varchar("buton_metni", { length: 80 }),
  sira: integer("sira").default(0).notNull(),
  aktif: boolean("aktif").default(true).notNull(),
  baslangicTarihi: timestamp("baslangic_tarihi", { withTimezone: true }),
  bitisTarihi: timestamp("bitis_tarihi", { withTimezone: true }),
  ...zamanDamgalari,
});

/* ------------------------------------------------------------------ */
/* Teklif / siparis talepleri                                          */
/* ------------------------------------------------------------------ */

export const talepler = pgTable(
  "talepler",
  {
    id: serial("id").primaryKey(),
    /* Musteriye soylenecek kisa takip kodu, or. "BZT-4821" */
    kod: varchar("kod", { length: 24 }).notNull(),
    adSoyad: varchar("ad_soyad", { length: 160 }).notNull(),
    telefon: varchar("telefon", { length: 32 }).notNull(),
    eposta: varchar("eposta", { length: 255 }),
    mesaj: text("mesaj"),
    durum: talepDurumuEnum("durum").default("yeni").notNull(),
    yoneticiNotu: text("yonetici_notu"),
    toplamTutar: numeric("toplam_tutar", { precision: 12, scale: 2 }),
    ...zamanDamgalari,
  },
  (t) => [uniqueIndex("talepler_kod_idx").on(t.kod), index("talepler_durum_idx").on(t.durum)],
);

/*
 * Talep kalemleri urun adini ve fiyatini kopyalayarak saklar. Urun sonradan
 * silinse ya da fiyati degisse bile talebin o gunku hali korunmali - aksi halde
 * gecmis talepler yanlis tutarlarla gorunur.
 */
export const talepKalemleri = pgTable(
  "talep_kalemleri",
  {
    id: serial("id").primaryKey(),
    talepId: integer("talep_id")
      .notNull()
      .references(() => talepler.id, { onDelete: "cascade" }),
    urunId: integer("urun_id").references(() => urunler.id, { onDelete: "set null" }),
    urunAdi: varchar("urun_adi", { length: 240 }).notNull(),
    urunSlug: varchar("urun_slug", { length: 260 }),
    birimFiyat: numeric("birim_fiyat", { precision: 12, scale: 2 }),
    adet: integer("adet").default(1).notNull(),
  },
  (t) => [index("talep_kalemleri_talep_idx").on(t.talepId)],
);

/* ------------------------------------------------------------------ */
/* Galeri                                                              */
/* ------------------------------------------------------------------ */

export const galeriGorselleri = pgTable("galeri_gorselleri", {
  id: serial("id").primaryKey(),
  baslik: varchar("baslik", { length: 200 }),
  url: text("url").notNull(),
  depoKimligi: text("depo_kimligi"),
  sira: integer("sira").default(0).notNull(),
  aktif: boolean("aktif").default(true).notNull(),
  olusturmaTarihi: timestamp("olusturma_tarihi", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/* Banka hesaplari                                                     */
/* ------------------------------------------------------------------ */

export const bankaHesaplari = pgTable("banka_hesaplari", {
  id: serial("id").primaryKey(),
  bankaAdi: varchar("banka_adi", { length: 120 }).notNull(),
  hesapSahibi: varchar("hesap_sahibi", { length: 200 }).notNull(),
  iban: varchar("iban", { length: 40 }).notNull(),
  sube: varchar("sube", { length: 120 }),
  sira: integer("sira").default(0).notNull(),
  aktif: boolean("aktif").default(true).notNull(),
  ...zamanDamgalari,
});

/* ------------------------------------------------------------------ */
/* Site ayarlari - anahtar/deger                                       */
/* ------------------------------------------------------------------ */

export const ayarlar = pgTable("ayarlar", {
  anahtar: varchar("anahtar", { length: 80 }).primaryKey(),
  deger: jsonb("deger").notNull(),
  guncellemeTarihi: timestamp("guncelleme_tarihi", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/* Iliskiler                                                           */
/* ------------------------------------------------------------------ */

export const kategoriIliskileri = relations(kategoriler, ({ one, many }) => ({
  ustKategori: one(kategoriler, {
    fields: [kategoriler.ustKategoriId],
    references: [kategoriler.id],
    relationName: "kategoriAgaci",
  }),
  altKategoriler: many(kategoriler, { relationName: "kategoriAgaci" }),
  urunler: many(urunler),
}));

export const markaIliskileri = relations(markalar, ({ many }) => ({
  urunler: many(urunler),
}));

export const urunIliskileri = relations(urunler, ({ one, many }) => ({
  kategori: one(kategoriler, { fields: [urunler.kategoriId], references: [kategoriler.id] }),
  marka: one(markalar, { fields: [urunler.markaId], references: [markalar.id] }),
  gorseller: many(urunGorselleri),
  ozellikler: many(urunOzellikleri),
}));

export const urunGorselIliskileri = relations(urunGorselleri, ({ one }) => ({
  urun: one(urunler, { fields: [urunGorselleri.urunId], references: [urunler.id] }),
}));

export const urunOzellikIliskileri = relations(urunOzellikleri, ({ one }) => ({
  urun: one(urunler, { fields: [urunOzellikleri.urunId], references: [urunler.id] }),
}));

export const talepIliskileri = relations(talepler, ({ many }) => ({
  kalemler: many(talepKalemleri),
}));

export const talepKalemIliskileri = relations(talepKalemleri, ({ one }) => ({
  talep: one(talepler, { fields: [talepKalemleri.talepId], references: [talepler.id] }),
  urun: one(urunler, { fields: [talepKalemleri.urunId], references: [urunler.id] }),
}));

/* ------------------------------------------------------------------ */
/* Tip kisayollari                                                     */
/* ------------------------------------------------------------------ */

export type Yonetici = typeof yoneticiler.$inferSelect;
export type YeniYonetici = typeof yoneticiler.$inferInsert;
export type Kategori = typeof kategoriler.$inferSelect;
export type YeniKategori = typeof kategoriler.$inferInsert;
export type Marka = typeof markalar.$inferSelect;
export type YeniMarka = typeof markalar.$inferInsert;
export type Urun = typeof urunler.$inferSelect;
export type YeniUrun = typeof urunler.$inferInsert;
export type UrunGorseli = typeof urunGorselleri.$inferSelect;
export type UrunOzelligi = typeof urunOzellikleri.$inferSelect;
export type Afis = typeof afisler.$inferSelect;
export type Talep = typeof talepler.$inferSelect;
export type TalepKalemi = typeof talepKalemleri.$inferSelect;
export type GaleriGorseli = typeof galeriGorselleri.$inferSelect;
export type BankaHesabi = typeof bankaHesaplari.$inferSelect;
