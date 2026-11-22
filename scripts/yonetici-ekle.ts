import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

import { eq } from "drizzle-orm";

import { sifreKurallariniDenetle, sifreOzetle } from "../lib/auth/sifre";
import * as schema from "../lib/db/schema";
import { uzakAdres, uzakBetikBaglantisi } from "../lib/db/uzak";

/**
 * Canlı veritabanında yönetici hesabı açar ya da şifresini yeniler — örnek veri
 * (tohum) olmadan. Canlı kurulumda: önce `npm run db:migrate`, sonra bu.
 *
 *   DATABASE_URL="<session pooler adresi>" YONETICI_EPOSTA=… YONETICI_SIFRE=… YONETICI_AD="Ad Soyad" npm run db:yonetici
 *
 * Şifre sitenin kuralına uymalı (en az 10 karakter, harf ve rakam). Hesap "admin" rolüyle açılır.
 */
async function calistir() {
  const adres = uzakAdres();
  if (!adres) throw new Error("DATABASE_URL tanımlı değil (canlı veritabanının adresi).");
  const eposta = process.env.YONETICI_EPOSTA?.trim().toLowerCase();
  const sifre = process.env.YONETICI_SIFRE ?? "";
  const ad = process.env.YONETICI_AD?.trim() || "Yönetici";
  if (!eposta || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) throw new Error("YONETICI_EPOSTA geçerli bir e-posta olmalı.");
  const kural = sifreKurallariniDenetle(sifre);
  if (kural) throw new Error(`YONETICI_SIFRE: ${kural}`);

  const { db, kapat } = uzakBetikBaglantisi(adres, schema);
  try {
    const ozet = await sifreOzetle(sifre);
    const mevcut = await db.select({ id: schema.yoneticiler.id }).from(schema.yoneticiler).where(eq(schema.yoneticiler.eposta, eposta)).limit(1);
    if (mevcut[0]) {
      await db.update(schema.yoneticiler).set({ sifreOzeti: ozet, adSoyad: ad, rol: "admin", aktif: true }).where(eq(schema.yoneticiler.id, mevcut[0].id));
      console.log(`✓ ${eposta} güncellendi (şifre yenilendi, rol admin).`);
    } else {
      await db.insert(schema.yoneticiler).values({ eposta, sifreOzeti: ozet, adSoyad: ad, rol: "admin", aktif: true });
      console.log(`✓ ${eposta} yönetici olarak açıldı.`);
    }
  } finally {
    await kapat();
  }
}

calistir().catch((e) => {
  console.error("✗", (e as Error).message);
  process.exit(1);
});
