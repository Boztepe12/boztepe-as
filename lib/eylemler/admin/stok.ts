"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNotNull } from "drizzle-orm";

import { eylemIcinOturum } from "@/lib/auth/koruma";
import { db } from "@/lib/db";
import { stokEntegrasyonu, urunler } from "@/lib/db/schema";
import { baglantiyiDene, StokApiHatasi } from "@/lib/stok/istemci";
import { durumOku, esitle } from "@/lib/stok/esitle";

export type StokEylemSonucu = { durum: "basarili"; mesaj: string } | { durum: "hata"; mesaj: string };

const hataMesaji = (e: unknown) =>
  e instanceof StokApiHatasi ? e.message : "İşlem tamamlanamadı. Lütfen tekrar deneyin.";

/** "Şimdi eşitle" — değişenleri; tam = true ise bütün ürünleri baştan. */
export async function stokEsitle(tam: boolean): Promise<StokEylemSonucu> {
  await eylemIcinOturum();
  try {
    const r = await esitle({ tam });
    const parcalar = [
      r.eklenen && `${r.eklenen} yeni ürün`,
      r.guncellenen && `${r.guncellenen} ürün güncellendi`,
      r.kaldirilan && `${r.kaldirilan} ürün kaldırıldı`,
    ].filter(Boolean);
    if (r.hatalar.length) return { durum: "hata", mesaj: `${r.hatalar.length} ürün yazılamadı: ${r.hatalar[0]}` };
    return { durum: "basarili", mesaj: parcalar.length ? parcalar.join(", ") + "." : "Her şey güncel." };
  } catch (e) {
    return { durum: "hata", mesaj: hataMesaji(e) };
  }
}

export async function stokBaglantisiniDene(): Promise<StokEylemSonucu> {
  await eylemIcinOturum();
  try {
    const { firma } = await baglantiyiDene();
    return { durum: "basarili", mesaj: firma ? `Bağlantı çalışıyor: ${firma}` : "Bağlantı çalışıyor." };
  } catch (e) {
    return { durum: "hata", mesaj: hataMesaji(e) };
  }
}

export async function yeniUrunAyari(yayinla: boolean): Promise<StokEylemSonucu> {
  await eylemIcinOturum();
  await durumOku();
  await db.update(stokEntegrasyonu).set({ yeniUrunleriYayinla: yayinla, guncellemeTarihi: new Date() })
    .where(eq(stokEntegrasyonu.id, 1));
  revalidatePath("/admin/stok");
  return { durum: "basarili", mesaj: "Kaydedildi." };
}

/** Stoktan gelen ürünleri toplu yayınla / gizle. */
export async function stokUrunleriniYayinla(idler: number[], yayinla: boolean): Promise<StokEylemSonucu> {
  await eylemIcinOturum();
  const temiz = idler.filter((i) => Number.isInteger(i) && i > 0).slice(0, 1000);
  if (temiz.length === 0) return { durum: "hata", mesaj: "Ürün seçin." };
  await db.update(urunler).set({ aktif: yayinla, guncellemeTarihi: new Date() })
    .where(and(inArray(urunler.id, temiz), isNotNull(urunler.stokBarkod), eq(urunler.stokKaldirildi, false)));
  revalidatePath("/", "layout");
  revalidatePath("/urunler");
  revalidatePath("/admin/stok");
  revalidatePath("/admin/urunler");
  return { durum: "basarili", mesaj: yayinla ? `${temiz.length} ürün yayında.` : `${temiz.length} ürün gizlendi.` };
}

/**
 * Bir ürünün stok sistemini izleyip izlemeyeceği. Açılan ayar hemen uygulanır:
 * fiyat stok sistemindeki liste fiyatına, stok durumu stok miktarına çekilir.
 */
export async function urunStokAyari(
  id: number,
  ayar: { fiyatStoktan: boolean; stokDurumuStoktan: boolean },
): Promise<StokEylemSonucu> {
  await eylemIcinOturum();
  const u = (await db.select().from(urunler).where(eq(urunler.id, id)).limit(1))[0];
  if (!u || !u.stokBarkod) return { durum: "hata", mesaj: "Bu ürün stok sistemine bağlı değil." };
  const stokta = Number(u.stokMiktari ?? 0) > 0;
  await db.update(urunler).set({
    fiyatStoktan: ayar.fiyatStoktan,
    stokDurumuStoktan: ayar.stokDurumuStoktan,
    ...(ayar.fiyatStoktan && u.stokListeFiyati ? { fiyat: u.stokListeFiyati } : {}),
    ...(ayar.stokDurumuStoktan ? { stokDurumu: stokta ? ("stokta" as const) : ("tukendi" as const) } : {}),
    guncellemeTarihi: new Date(),
  }).where(eq(urunler.id, id));
  revalidatePath(`/admin/urunler/${id}`);
  revalidatePath(`/urun/${u.slug}`);
  revalidatePath("/urunler");
  return { durum: "basarili", mesaj: "Kaydedildi." };
}
