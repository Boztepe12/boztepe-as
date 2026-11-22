import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export type YuklenenGorsel = { url: string; kimlik: string };

const IZINLI_TIPLER = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const AZAMI_BOYUT = 8 * 1024 * 1024; // 8 MB

export class GorselHatasi extends Error {}

function dosyayiDenetle(dosya: File) {
  if (!IZINLI_TIPLER.includes(dosya.type)) {
    throw new GorselHatasi("Yalnızca JPG, PNG, WEBP, AVIF veya GIF yükleyebilirsiniz.");
  }
  if (dosya.size > AZAMI_BOYUT) {
    throw new GorselHatasi("Görsel en fazla 8 MB olabilir.");
  }
  if (dosya.size === 0) {
    throw new GorselHatasi("Dosya boş görünüyor.");
  }
}

const cloudinaryAdi = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const cloudinaryAnahtar = process.env.CLOUDINARY_API_KEY?.trim();
const cloudinaryGizli = process.env.CLOUDINARY_API_SECRET?.trim();

export const cloudinaryHazir = Boolean(cloudinaryAdi && cloudinaryAnahtar && cloudinaryGizli);

/**
 * Cloudinary imzalı yükleme. SDK yerine doğrudan REST kullanıyoruz; tek yaptığımız
 * iş yükleme ve silme olduğu için ek bir bağımlılık taşımaya değmiyor.
 *
 * İmza kuralı: alfabetik sıralanmış parametreler `anahtar=deger&...` biçiminde
 * birleştirilip sonuna API gizli anahtarı eklenir ve SHA-1 özeti alınır.
 */
function imzala(parametreler: Record<string, string>): string {
  const metin = Object.keys(parametreler)
    .sort()
    .map((anahtar) => `${anahtar}=${parametreler[anahtar]}`)
    .join("&");

  return createHash("sha1").update(`${metin}${cloudinaryGizli}`).digest("hex");
}

async function cloudinaryYukle(dosya: File, klasor: string): Promise<YuklenenGorsel> {
  const zaman = Math.floor(Date.now() / 1000).toString();
  const imzaParametreleri = { folder: klasor, timestamp: zaman };

  const govde = new FormData();
  govde.append("file", dosya);
  govde.append("api_key", cloudinaryAnahtar!);
  govde.append("timestamp", zaman);
  govde.append("folder", klasor);
  govde.append("signature", imzala(imzaParametreleri));

  const yanit = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryAdi}/image/upload`, {
    method: "POST",
    body: govde,
  });

  if (!yanit.ok) {
    const metin = await yanit.text().catch(() => "");
    throw new GorselHatasi(
      `Cloudinary yüklemesi başarısız (${yanit.status}). ${metin.slice(0, 200)}`,
    );
  }

  const sonuc = (await yanit.json()) as { secure_url?: string; public_id?: string };
  if (!sonuc.secure_url || !sonuc.public_id) {
    throw new GorselHatasi("Cloudinary beklenen yanıtı döndürmedi.");
  }

  return { url: sonuc.secure_url, kimlik: sonuc.public_id };
}

async function cloudinarySil(kimlik: string): Promise<void> {
  const zaman = Math.floor(Date.now() / 1000).toString();
  const govde = new FormData();
  govde.append("public_id", kimlik);
  govde.append("api_key", cloudinaryAnahtar!);
  govde.append("timestamp", zaman);
  govde.append("signature", imzala({ public_id: kimlik, timestamp: zaman }));

  await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryAdi}/image/destroy`, {
    method: "POST",
    body: govde,
  });
}

/**
 * Geliştirme sürücüsü: dosyayı `public/yuklenenler` altına yazar.
 *
 * Vercel'in dosya sistemi salt okunurdur, bu yüzden üretimde çalışmaz — orada
 * Cloudinary anahtarlarının tanımlı olması gerekir. Amaç, anahtarlar gelmeden de
 * yönetim panelinin uçtan uca denenebilmesi.
 */
async function yerelYukle(dosya: File, klasor: string): Promise<YuklenenGorsel> {
  /*
   * Uzantı dosya adından değil, izin verilen türden gelir: "image/png" diye
   * bildirilmiş bir "x.html" sitenin adresinden HTML olarak sunulamasın.
   */
  const TURDEN_UZANTI: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif",
    "application/pdf": "pdf",
  };
  const guvenliUzanti = TURDEN_UZANTI[dosya.type] ?? "bin";
  const dosyaAdi = `${randomUUID()}.${guvenliUzanti}`;

  const hedefKlasor = path.join(process.cwd(), "public", "yuklenenler", klasor);
  await mkdir(hedefKlasor, { recursive: true });

  const tampon = Buffer.from(await dosya.arrayBuffer());
  await writeFile(path.join(hedefKlasor, dosyaAdi), tampon);

  return { url: `/yuklenenler/${klasor}/${dosyaAdi}`, kimlik: `yerel:${klasor}/${dosyaAdi}` };
}

async function yerelSil(kimlik: string): Promise<void> {
  if (!kimlik.startsWith("yerel:")) return;
  const gorecelYol = kimlik.slice("yerel:".length);

  /* Yol geçişi denemelerine karşı: hedef her zaman public/yuklenenler altında kalmalı. */
  const kok = path.join(process.cwd(), "public", "yuklenenler");
  const tamYol = path.resolve(kok, gorecelYol);
  if (!tamYol.startsWith(kok)) return;

  await unlink(tamYol).catch(() => {
    /* Dosya zaten yoksa sorun değil. */
  });
}

/** Görseli yükler ve kalıcı adresini döner. */
export async function gorselYukle(dosya: File, klasor = "urunler"): Promise<YuklenenGorsel> {
  dosyayiDenetle(dosya);
  const guvenliKlasor = klasor.replace(/[^a-z0-9-]/gi, "") || "genel";

  return cloudinaryHazir
    ? cloudinaryYukle(dosya, `boztepe/${guvenliKlasor}`)
    : yerelYukle(dosya, guvenliKlasor);
}

/**
 * Görseli depodan siler. Kayıt zaten veritabanından kaldırıldığı için buradaki
 * hata kullanıcıya yansıtılmaz; en kötü ihtimalle depoda artık bir dosya kalır.
 */
export async function gorselSil(kimlik: string | null | undefined): Promise<void> {
  if (!kimlik) return;

  try {
    if (kimlik.startsWith("yerel:")) await yerelSil(kimlik);
    else if (cloudinaryHazir) await cloudinarySil(kimlik);
  } catch {
    /* Yoksay. */
  }
}

/* ------------------------------------------------------------------ */
/* PDF katalogları                                                     */
/* ------------------------------------------------------------------ */

/** Yerelde (geliştirme) yüklenebilecek en büyük PDF. */
export const PDF_AZAMI_BOYUT = 50 * 1024 * 1024; // 50 MB

export function pdfDenetle(dosya: File) {
  const pdfMi = dosya.type === "application/pdf" || dosya.name.toLowerCase().endsWith(".pdf");
  if (!pdfMi) throw new GorselHatasi("Yalnızca PDF dosyası yükleyebilirsiniz.");
  if (dosya.size === 0) throw new GorselHatasi("Dosya boş görünüyor.");
  if (dosya.size > PDF_AZAMI_BOYUT) throw new GorselHatasi("PDF en fazla 50 MB olabilir.");
}

/**
 * Cloudinary'ye tarayıcıdan doğrudan yükleme için imza. PDF'ler büyük olabildiği
 * için sunucudan geçirilmez (Vercel fonksiyonları ~4.5 MB'tan büyük isteği
 * almaz); sunucu yalnızca imzayı verir. Dosya `raw` türünde, katalog klasörüne
 * gider. Cloudinary yoksa null: geliştirmede sunucu üstünden yerel yükleme.
 */
export function pdfYuklemeImzasi(): { bulut: string; anahtar: string; zaman: string; klasor: string; imza: string } | null {
  if (!cloudinaryHazir) return null;
  const zaman = Math.floor(Date.now() / 1000).toString();
  const klasor = "boztepe/kataloglar";
  return { bulut: cloudinaryAdi!, anahtar: cloudinaryAnahtar!, zaman, klasor, imza: imzala({ folder: klasor, timestamp: zaman }) };
}

/** Geliştirme: PDF'i public/yuklenenler/kataloglar altına yazar. */
export async function pdfYerelYukle(dosya: File): Promise<YuklenenGorsel> {
  pdfDenetle(dosya);
  return yerelYukle(new File([dosya], "katalog.pdf", { type: "application/pdf" }), "kataloglar");
}

/** Cloudinary'den gelen bir PDF kimliğini depo kimliği biçimine çevirir ("raw:" öneki silmek için gerekir). */
export function bulutPdfKimligi(publicId: string): string {
  return `raw:${publicId}`;
}

/** Yüklenmiş PDF'i siler; hata kullanıcıya yansıtılmaz. */
export async function pdfSil(kimlik: string | null | undefined): Promise<void> {
  if (!kimlik) return;
  try {
    if (kimlik.startsWith("yerel:")) {
      await yerelSil(kimlik);
    } else if (kimlik.startsWith("raw:") && cloudinaryHazir) {
      const publicId = kimlik.slice(4);
      const zaman = Math.floor(Date.now() / 1000).toString();
      const govde = new FormData();
      govde.append("public_id", publicId);
      govde.append("api_key", cloudinaryAnahtar!);
      govde.append("timestamp", zaman);
      govde.append("signature", imzala({ public_id: publicId, timestamp: zaman }));
      await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryAdi}/raw/destroy`, { method: "POST", body: govde });
    }
  } catch {
    /* Yoksay. */
  }
}
