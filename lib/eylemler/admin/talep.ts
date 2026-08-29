"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { eylemIcinOturum } from "@/lib/auth/koruma";
import { db } from "@/lib/db";
import { talepler } from "@/lib/db/schema";

import type { EylemSonucu } from "./urun";

const DURUMLAR = ["yeni", "arandi", "teklif_verildi", "satisa_donustu", "iptal"] as const;

const DurumSemasi = z.enum(DURUMLAR);
const NotSemasi = z.string().trim().max(4000, "Not en fazla 4000 karakter olabilir.");

function onbellekTazele(id?: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/talepler");
  if (id) revalidatePath(`/admin/talepler/${id}`);
}

/**
 * Talebin durumunu değiştirir. Durum, mağazanın takip akışıdır:
 * yeni → arandı → teklif verildi → satışa dönüştü (veya iptal).
 */
export async function talepDurumGuncelle(id: number, durum: string): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const cozum = DurumSemasi.safeParse(durum);
  if (!cozum.success) return { durum: "hata", mesaj: "Geçersiz talep durumu." };

  const kayitlar = await db
    .select({ id: talepler.id })
    .from(talepler)
    .where(eq(talepler.id, id))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Talep bulunamadı." };

  await db
    .update(talepler)
    .set({ durum: cozum.data, guncellemeTarihi: new Date() })
    .where(eq(talepler.id, id));

  onbellekTazele(id);
  return { durum: "basarili", mesaj: "Talep durumu güncellendi." };
}

/** Yöneticinin talebe düştüğü serbest not — müşteriye görünmez. */
export async function talepNotuKaydet(id: number, not: string): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const cozum = NotSemasi.safeParse(not);
  if (!cozum.success) {
    return { durum: "hata", mesaj: cozum.error.issues[0]?.message ?? "Not kaydedilemedi." };
  }

  const kayitlar = await db
    .select({ id: talepler.id })
    .from(talepler)
    .where(eq(talepler.id, id))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Talep bulunamadı." };

  await db
    .update(talepler)
    /* Boş not, "not girilmemiş" demek; boş metin yerine null saklıyoruz. */
    .set({ yoneticiNotu: cozum.data || null, guncellemeTarihi: new Date() })
    .where(eq(talepler.id, id));

  onbellekTazele(id);
  return { durum: "basarili", mesaj: "Not kaydedildi." };
}

/**
 * Talebi siler. Kalemler veritabanı tarafında cascade ile birlikte gider.
 * Silme yerine "iptal" durumu tercih edilmeli; bu yüzden arayüzde ikinci planda duruyor.
 */
export async function talepSil(id: number): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const kayitlar = await db
    .select({ id: talepler.id })
    .from(talepler)
    .where(eq(talepler.id, id))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Talep bulunamadı." };

  await db.delete(talepler).where(eq(talepler.id, id));

  onbellekTazele();
  return { durum: "basarili", mesaj: "Talep silindi." };
}

/** Listeden seçilen talepleri tek seferde aynı duruma taşır. */
export async function taleplerToplu(kimlikler: number[], durum: string): Promise<EylemSonucu> {
  await eylemIcinOturum();

  if (kimlikler.length === 0) return { durum: "hata", mesaj: "Talep seçilmedi." };

  const cozum = DurumSemasi.safeParse(durum);
  if (!cozum.success) return { durum: "hata", mesaj: "Geçersiz talep durumu." };

  await db
    .update(talepler)
    .set({ durum: cozum.data, guncellemeTarihi: new Date() })
    .where(inArray(talepler.id, kimlikler));

  onbellekTazele();
  return { durum: "basarili", mesaj: `${kimlikler.length} talep güncellendi.` };
}
