import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const OTURUM_COOKIE = "boztepe_oturum";

/** Oturum süresi: mağaza içinde gün boyu açık kalabilsin diye 7 gün. */
const OMUR_SANIYE = 60 * 60 * 24 * 7;

export type OturumBilgisi = {
  id: number;
  eposta: string;
  adSoyad: string;
  rol: "admin" | "editor";
};

/*
 * Anahtar üretimini modül yüklenirken değil, ilk kullanımda yapıyoruz.
 * Böylece `next build` sırasında (env henüz yokken) hata fırlamaz; eksik anahtar
 * ancak gerçekten bir oturum işlemi denendiğinde ve açık bir mesajla ortaya çıkar.
 */
let onbellektekiAnahtar: Uint8Array | null = null;

function anahtar(): Uint8Array {
  if (onbellektekiAnahtar) return onbellektekiAnahtar;

  const gizli = process.env.OTURUM_GIZLI_ANAHTAR;
  if (!gizli || gizli.length < 32) {
    throw new Error(
      "OTURUM_GIZLI_ANAHTAR tanımlı değil veya 32 karakterden kısa. " +
        "`.env.local` dosyasına en az 32 karakterlik rastgele bir değer ekleyin.",
    );
  }

  onbellektekiAnahtar = new TextEncoder().encode(gizli);
  return onbellektekiAnahtar;
}

export async function oturumJetonuUret(bilgi: OturumBilgisi): Promise<string> {
  return new SignJWT({ ...bilgi })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("boztepeas.com")
    .setAudience("boztepeas-admin")
    .setExpirationTime(`${OMUR_SANIYE}s`)
    .sign(anahtar());
}

export async function oturumJetonunuCoz(jeton: string): Promise<OturumBilgisi | null> {
  try {
    const { payload } = await jwtVerify(jeton, anahtar(), {
      issuer: "boztepeas.com",
      audience: "boztepeas-admin",
      algorithms: ["HS256"],
    });

    if (
      typeof payload.id !== "number" ||
      typeof payload.eposta !== "string" ||
      typeof payload.adSoyad !== "string" ||
      (payload.rol !== "admin" && payload.rol !== "editor")
    ) {
      return null;
    }

    return {
      id: payload.id,
      eposta: payload.eposta,
      adSoyad: payload.adSoyad,
      rol: payload.rol,
    };
  } catch {
    // Süresi dolmuş, imzası bozuk veya biçimi hatalı jeton — hepsi "oturum yok" demek.
    return null;
  }
}

export async function oturumAc(bilgi: OturumBilgisi): Promise<void> {
  const jeton = await oturumJetonuUret(bilgi);
  const cerezDeposu = await cookies();

  cerezDeposu.set(OTURUM_COOKIE, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OMUR_SANIYE,
  });
}

export async function oturumKapat(): Promise<void> {
  const cerezDeposu = await cookies();
  cerezDeposu.delete(OTURUM_COOKIE);
}

/** Geçerli isteğin oturum bilgisini döner; oturum yoksa null. */
export async function mevcutOturum(): Promise<OturumBilgisi | null> {
  const cerezDeposu = await cookies();
  const jeton = cerezDeposu.get(OTURUM_COOKIE)?.value;
  if (!jeton) return null;
  return oturumJetonunuCoz(jeton);
}
