import { eq } from "drizzle-orm";

import { sifreKurallariniDenetle, sifreOzetle } from "../lib/auth/sifre";
import * as schema from "../lib/db/schema";
import { uzakAdres, uzakBetikBaglantisi } from "../lib/db/uzak";

/**
 * Canlı veritabanında yönetici hesabı açar ya da şifresini yeniler — örnek veri
 * (tohum) olmadan. Canlı kurulumda: önce `npm run db:migrate`, sonra bu.
 *
 *   DATABASE_URL="<session pooler adresi>" ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_NAME="Ad Soyad" npm run db:yonetici
 *
 * `.env.local` bilerek okunmaz: değerler yalnız komut satırından gelir, yereldeki
 * deneme şifresi yanlışlıkla canlıya yazılmasın.
 *
 * Şifre sitenin kuralına uymalı (en az 10 karakter, harf ve rakam). Hesap "admin" rolüyle açılır.
 */
async function calistir() {
  const adres = uzakAdres();
  if (!adres) throw new Error("DATABASE_URL tanımlı değil (canlı veritabanının adresi).");
  const eposta = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const sifre = process.env.ADMIN_PASSWORD ?? "";
  const ad = process.env.ADMIN_NAME?.trim() || "Yönetici";
  if (!eposta || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) throw new Error("ADMIN_EMAIL geçerli bir e-posta olmalı.");
  const kural = sifreKurallariniDenetle(sifre);
  if (kural) throw new Error(`ADMIN_PASSWORD: ${kural}`);

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
