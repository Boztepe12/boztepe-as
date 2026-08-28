import bcrypt from "bcryptjs";

/*
 * bcrypt maliyeti 12: Vercel'in ücretsiz katmanındaki CPU ile yaklaşık 200-300 ms
 * sürer. Girişi yavaşlatmadan kaba kuvvet denemelerini pahalı kılan makul bir denge.
 */
const MALIYET = 12;

export async function sifreOzetle(sifre: string): Promise<string> {
  return bcrypt.hash(sifre, MALIYET);
}

export async function sifreDogrula(sifre: string, ozet: string): Promise<boolean> {
  return bcrypt.compare(sifre, ozet);
}

/**
 * Şifre gücü kuralları. Mağaza personeli kullanacağı için kuralları uygulanabilir
 * tutuyoruz: uzunluk asıl koruyucu, karmaşıklık dayatması insanları "Sifre123!"
 * gibi tahmin edilebilir kalıplara itiyor.
 */
export function sifreKurallariniDenetle(sifre: string): string | null {
  if (sifre.length < 10) return "Şifre en az 10 karakter olmalı.";
  if (sifre.length > 200) return "Şifre çok uzun.";
  if (!/[a-zçğıöşü]/i.test(sifre)) return "Şifre en az bir harf içermeli.";
  if (!/\d/.test(sifre)) return "Şifre en az bir rakam içermeli.";
  return null;
}

/** Kurulumda kullanılacak, okunabilir ama tahmin edilemez geçici şifre üretir. */
export function gecerliSifreUret(): string {
  const harfler = "abcdefghjkmnpqrstuvwxyz";
  const buyukler = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const rakamlar = "23456789";
  const havuz = harfler + buyukler + rakamlar;
  const rastgele = (kaynak: string) => kaynak[Math.floor(Math.random() * kaynak.length)];

  const govde = Array.from({ length: 11 }, () => rastgele(havuz)).join("");
  return `${rastgele(buyukler)}${govde}${rastgele(rakamlar)}`;
}
