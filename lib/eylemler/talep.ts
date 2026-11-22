"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { talepKalemleri, talepler } from "@/lib/db/schema";
import { sepetUrunleri } from "@/lib/sorgular/urunler";

const KalemSemasi = z.object({
  urunId: z.number().int().positive(),
  adet: z.number().int().min(1).max(99),
});

const TalepSemasi = z.object({
  adSoyad: z.string().trim().min(2, "Adınızı yazın.").max(160),
  telefon: z
    .string()
    .trim()
    .min(10, "Telefon numarası eksik görünüyor.")
    .max(32)
    .regex(/^[0-9\s()+-]+$/, "Telefon yalnızca rakam ve +() - içerebilir."),
  eposta: z.union([z.string().trim().email("Geçerli bir e-posta yazın."), z.literal("")]).optional(),
  mesaj: z.string().trim().max(2000).optional(),
  kalemler: z.array(KalemSemasi).min(1, "Teklif sepetiniz boş.").max(50),
  /** Görünmez tuzak alan: doluysa gönderen bir bottur. */
  web: z.string().max(500).optional(),
});

/*
 * Basit hız sınırı: aynı IP'den 10 dakikada en fazla 5 talep. Bellek içi; Vercel'de
 * her sunucu örneğinin kendi sayacı olur, yani tam bir koruma değil — talep listesinin
 * bir betikle doldurulmasını yavaşlatır. Tuzak alanla birlikte çoğu spam'i keser.
 */
const PENCERE_MS = 10 * 60 * 1000;
const AZAMI_TALEP = 5;
const gonderimler = new Map<string, number[]>();

async function hizSiniriAsildi(): Promise<boolean> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "yerel").trim();
  const simdi = Date.now();
  const liste = (gonderimler.get(ip) ?? []).filter((t) => simdi - t < PENCERE_MS);
  if (liste.length >= AZAMI_TALEP) {
    gonderimler.set(ip, liste);
    return true;
  }
  liste.push(simdi);
  gonderimler.set(ip, liste);
  if (gonderimler.size > 5000) gonderimler.clear(); // bellek sınırsız büyümesin
  return false;
}

export type TalepSonucu =
  | { durum: "basarili"; kod: string }
  | { durum: "hata"; mesaj: string; alanlar?: Record<string, string> };

/** Müşteriye söylenecek kısa takip kodu üretir: BZT-4821 */
function kodUret(): string {
  return `BZT-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function benzersizKod(): Promise<string> {
  /* Çakışma ihtimali düşük ama sıfır değil; birkaç deneme yeterli. */
  for (let deneme = 0; deneme < 8; deneme++) {
    const aday = kodUret();
    const mevcut = await db
      .select({ id: talepler.id })
      .from(talepler)
      .where(eq(talepler.kod, aday))
      .limit(1);
    if (mevcut.length === 0) return aday;
  }
  /* Son çare: zaman damgasının son hanelerini kullan, çakışması pratikte imkânsız. */
  return `BZT-${Date.now().toString().slice(-6)}`;
}

export async function talepOlustur(girdi: unknown): Promise<TalepSonucu> {
  const cozum = TalepSemasi.safeParse(girdi);

  if (!cozum.success) {
    const alanlar: Record<string, string> = {};
    for (const sorun of cozum.error.issues) {
      const alan = sorun.path[0];
      if (typeof alan === "string" && !alanlar[alan]) alanlar[alan] = sorun.message;
    }
    return {
      durum: "hata",
      mesaj: "Formda eksik veya hatalı alanlar var.",
      alanlar,
    };
  }

  const veri = cozum.data;

  // Bot: başarılı gibi görünsün (denemeyi sürdürmesin), kayıt yazılmasın.
  if (veri.web) return { durum: "basarili", kod: kodUret() };
  if (await hizSiniriAsildi()) {
    return { durum: "hata", mesaj: "Kısa sürede çok fazla talep gönderildi. Lütfen biraz sonra tekrar deneyin ya da bizi arayın." };
  }

  /*
   * Fiyatı istemciden almıyoruz. Tarayıcıdaki sepet eskimiş ya da elle değiştirilmiş
   * olabilir; kaydedilen tutar her zaman veritabanındaki güncel fiyattan hesaplanır.
   */
  const urunler = await sepetUrunleri(veri.kalemler.map((k) => k.urunId));
  if (urunler.length === 0) {
    return { durum: "hata", mesaj: "Sepetinizdeki ürünler artık satışta değil." };
  }

  const urunHaritasi = new Map(urunler.map((u) => [u.id, u]));
  const kalemler = veri.kalemler
    .filter((k) => urunHaritasi.has(k.urunId))
    .map((k) => {
      const urun = urunHaritasi.get(k.urunId)!;
      const birimFiyat = urun.fiyatGizli ? null : (urun.indirimliFiyat ?? urun.fiyat);
      return {
        urunId: urun.id,
        urunAdi: urun.ad,
        urunSlug: urun.slug,
        birimFiyat,
        adet: k.adet,
      };
    });

  if (kalemler.length === 0) {
    return { durum: "hata", mesaj: "Sepetinizdeki ürünler artık satışta değil." };
  }

  const toplam = kalemler.reduce(
    (t, k) => t + (k.birimFiyat ? Number(k.birimFiyat) * k.adet : 0),
    0,
  );

  const kod = await benzersizKod();

  const [talep] = await db
    .insert(talepler)
    .values({
      kod,
      adSoyad: veri.adSoyad,
      telefon: veri.telefon,
      eposta: veri.eposta || null,
      mesaj: veri.mesaj || null,
      toplamTutar: toplam > 0 ? toplam.toFixed(2) : null,
    })
    .returning({ id: talepler.id });

  try {
    await db.insert(talepKalemleri).values(kalemler.map((k) => ({ ...k, talepId: talep.id })));
  } catch (hata) {
    /*
     * Neon'un HTTP sürücüsü işlem (transaction) desteklemiyor. Kalemler yazılamazsa
     * içi boş bir talep kaydı kalmasın diye başlığı geri alıyoruz — müşteri hatayı
     * görüp yeniden gönderebilir, yönetici de yarım kayıtla uğraşmaz.
     */
    await db.delete(talepler).where(eq(talepler.id, talep.id));
    throw hata;
  }

  return { durum: "basarili", kod };
}
