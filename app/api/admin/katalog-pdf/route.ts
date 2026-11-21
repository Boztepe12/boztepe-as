import { eylemIcinOturum } from "@/lib/auth/koruma";
import { cloudinaryHazir, GorselHatasi, pdfYerelYukle } from "@/lib/storage";

/**
 * POST /api/admin/katalog-pdf — geliştirmede (Cloudinary yokken) katalog PDF'ini
 * public/yuklenenler/kataloglar altına yazar. Sunucu eylemleri 1 MB'tan büyük
 * gövde almadığı için ayrı bir rota. Canlıda (Cloudinary varken) kullanılmaz:
 * tarayıcı dosyayı doğrudan Cloudinary'ye yükler.
 */
export async function POST(request: Request) {
  try {
    await eylemIcinOturum();
  } catch (e) {
    return Response.json({ hata: (e as Error).message }, { status: 401 });
  }
  if (cloudinaryHazir) return Response.json({ hata: "Dosya doğrudan buluta yüklenmeli." }, { status: 400 });
  const veri = await request.formData().catch(() => null);
  const dosya = veri?.get("dosya");
  if (!(dosya instanceof File)) return Response.json({ hata: "Dosya seçilmedi." }, { status: 400 });
  try {
    const y = await pdfYerelYukle(dosya);
    return Response.json({ url: y.url, kimlik: y.kimlik, ad: dosya.name, boyut: dosya.size });
  } catch (e) {
    const mesaj = e instanceof GorselHatasi ? e.message : "Dosya yüklenemedi.";
    return Response.json({ hata: mesaj }, { status: 400 });
  }
}
