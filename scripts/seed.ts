import { config } from "dotenv";

/* Next.js `.env.local` okur ama `dotenv/config` yalnizca `.env` bakar; ikisini de yukluyoruz. */
config({ path: ".env.local", quiet: true });
config({ quiet: true });

import { PGlite } from "@electric-sql/pglite";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";

import type { VeritabaniBaglantisi } from "../lib/db";
import * as schema from "../lib/db/schema";
import { gecerliSifreUret, sifreOzetle } from "../lib/auth/sifre";
import { sadelestir, slugOlustur } from "../lib/utils";

/* ------------------------------------------------------------------ */
/* Bağlantı                                                            */
/* ------------------------------------------------------------------ */

const adres = process.env.DATABASE_URL?.trim();
const neonMu = Boolean(adres && /^postgres(ql)?:\/\//.test(adres));

const pglite = neonMu ? null : new PGlite("./.pglite");

/*
 * İki sürücünün birleşim tipi, `.returning()` gibi aşırı yüklenmiş metotlarda
 * TypeScript'i çıkmaza sokuyor. Uygulama tarafındaki `lib/db` ile aynı yaklaşımı
 * izleyip tek bir tip üzerinden ilerliyoruz.
 */
const db = (
  neonMu
    ? drizzleNeon(neon(adres!), { schema, casing: "snake_case" })
    : drizzlePglite(pglite!, { schema, casing: "snake_case" })
) as unknown as VeritabaniBaglantisi;

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */

/**
 * Ürünün aranabilir metnini önceden hesaplar. Arama sorgusu tek bir sütuna
 * bakacağı için ürün adı, marka ve kategori burada birleştirilip sadeleştirilir.
 */
function aramaMetniUret(parcalar: (string | null | undefined)[]): string {
  return sadelestir(parcalar.filter(Boolean).join(" "));
}

/** Görsel gelene kadar kullanılacak, kategoriye uygun renkli yer tutucu. */
function yerTutucu(baslik: string, ton: string): string {
  const metin = encodeURIComponent(baslik);
  return `https://placehold.co/1200x900/${ton}/ffffff/png?text=${metin}&font=source-sans-pro`;
}

/* ------------------------------------------------------------------ */
/* Veri                                                                */
/* ------------------------------------------------------------------ */

type AltKategoriTanimi = { ad: string; aciklama?: string };
type KategoriTanimi = {
  ad: string;
  aciklama: string;
  ton: string;
  anaSayfada: boolean;
  altlar: AltKategoriTanimi[];
};

const KATEGORILER: KategoriTanimi[] = [
  {
    ad: "Beyaz Eşya",
    aciklama:
      "Vestel yetkili bayisi olarak buzdolabından klimaya kadar tüm beyaz eşya ihtiyacınız, " +
      "kurulum ve garanti desteğiyle birlikte.",
    ton: "3E4C59",
    anaSayfada: true,
    altlar: [
      { ad: "Buzdolabı" },
      { ad: "Çamaşır Makinesi" },
      { ad: "Bulaşık Makinesi" },
      { ad: "Fırın ve Ankastre" },
      { ad: "Klima" },
      { ad: "Televizyon" },
      { ad: "Küçük Ev Aletleri" },
    ],
  },
  {
    ad: "Mobilya",
    aciklama:
      "Oturma grubundan yatak odasına, evinizin her köşesi için özenle seçilmiş mobilyalar. " +
      "Showroomumuzda dokunarak görebilir, ölçüye göre sipariş verebilirsiniz.",
    ton: "8A6244",
    anaSayfada: true,
    altlar: [
      { ad: "Oturma Grubu" },
      { ad: "Köşe Takımı" },
      { ad: "Yatak Odası" },
      { ad: "Yemek Odası" },
      { ad: "Genç ve Çocuk Odası" },
      { ad: "TV Ünitesi" },
    ],
  },
  {
    ad: "Halı",
    aciklama:
      "Salonunuzu tamamlayan makine halıları, yolluklar ve kilimler. " +
      "Farklı ölçü ve desen seçenekleriyle mağazamızda.",
    ton: "9C5B4A",
    anaSayfada: true,
    altlar: [{ ad: "Salon Halısı" }, { ad: "Yolluk" }, { ad: "Kilim" }, { ad: "Makine Halısı" }],
  },
];

const MARKALAR = [
  { ad: "Vestel", aciklama: "Beyaz eşya ve elektronikte Türkiye'nin öncü markası. Yetkili bayisiyiz." },
  { ad: "Vilinze", aciklama: "Modern çizgide oturma grubu ve yemek odası takımları." },
  { ad: "Venti Mobilya", aciklama: "Sade tasarımlı, dayanıklı ev mobilyaları." },
  { ad: "Slims", aciklama: "Küçük alanlar için tasarlanmış, ince hatlı mobilya çözümleri." },
  { ad: "Arno Home", aciklama: "Ev tekstili ve dekoratif mobilya koleksiyonları." },
  { ad: "Turuncu Mobilya", aciklama: "Genç odası ve renkli yaşam alanı mobilyaları." },
  { ad: "Castor", aciklama: "Yatak odası ve depolama çözümlerinde işlevsel tasarımlar." },
  { ad: "Arno Go", aciklama: "Hızlı teslim edilen, kolay kurulumlu mobilya serisi." },
];

type UrunTanimi = {
  ad: string;
  kategori: string;
  marka: string;
  fiyat: number;
  indirimli?: number;
  kisa: string;
  aciklama: string;
  taksit?: number;
  garanti?: string;
  stok?: "stokta" | "tukendi" | "siparise_bagli";
  oneCikan?: boolean;
  yeni?: boolean;
  ton: string;
  ozellikler: [string, string][];
};

const URUNLER: UrunTanimi[] = [
  /* ---------------- Beyaz eşya ---------------- */
  {
    ad: "Vestel NFK540 X A++ No-Frost Buzdolabı",
    kategori: "Buzdolabı",
    marka: "Vestel",
    fiyat: 32499,
    indirimli: 26999,
    kisa: "540 litre brüt hacim, No-Frost teknolojisi, inox kaplama.",
    aciklama:
      "Geniş ailelerin ihtiyacını karşılayan 540 litrelik brüt hacmiyle haftalık alışverişinizi " +
      "rahatça yerleştirebilirsiniz. No-Frost teknolojisi buzlanmayı önler, düzenli buz çözme " +
      "derdini ortadan kaldırır. A++ enerji sınıfı sayesinde elektrik faturanızı düşük tutar. " +
      "Parmak izi tutmayan inox kaplama mutfağınıza modern bir görünüm katar.",
    taksit: 12,
    garanti: "3 yıl Vestel garantisi",
    oneCikan: true,
    ton: "3E4C59",
    ozellikler: [
      ["Enerji Sınıfı", "A++"],
      ["Brüt Hacim", "540 litre"],
      ["Soğutma Tipi", "No-Frost"],
      ["Kapı Sayısı", "2"],
      ["Ölçüler (Y x G x D)", "185 x 70 x 74 cm"],
      ["Renk", "Inox"],
    ],
  },
  {
    ad: "Vestel CMI 96101 9 Kg Çamaşır Makinesi",
    kategori: "Çamaşır Makinesi",
    marka: "Vestel",
    fiyat: 18750,
    indirimli: 14990,
    kisa: "9 kg kapasite, 1000 devir, 15 yıkama programı.",
    aciklama:
      "9 kilogramlık kapasitesiyle kalabalık ailelerin yükünü tek seferde alır. 1000 devir " +
      "sıkma hızı çamaşırlarınızı daha kuru bırakır, kurutma süresini kısaltır. Yünlü, hassas " +
      "ve hızlı yıkama dahil 15 farklı program ile her kumaşa uygun ayar bulunur.",
    taksit: 12,
    garanti: "3 yıl Vestel garantisi",
    oneCikan: true,
    ton: "3E4C59",
    ozellikler: [
      ["Kapasite", "9 kg"],
      ["Sıkma Devri", "1000 devir/dk"],
      ["Enerji Sınıfı", "A+++"],
      ["Program Sayısı", "15"],
      ["Ölçüler (Y x G x D)", "84 x 60 x 60 cm"],
    ],
  },
  {
    ad: "Vestel BM 5002 Bulaşık Makinesi",
    kategori: "Bulaşık Makinesi",
    marka: "Vestel",
    fiyat: 15900,
    kisa: "13 kişilik kapasite, 5 program, yarım yük seçeneği.",
    aciklama:
      "13 kişilik kapasitesi ile kalabalık sofraların ardından bile tek seferde iş görür. " +
      "Yarım yük programı az bulaşıkta su ve elektrikten tasarruf sağlar. Sessiz çalışma " +
      "seviyesi sayesinde açık mutfaklarda rahatsızlık vermez.",
    taksit: 9,
    garanti: "3 yıl Vestel garantisi",
    ton: "3E4C59",
    ozellikler: [
      ["Kapasite", "13 kişilik"],
      ["Program Sayısı", "5"],
      ["Enerji Sınıfı", "A++"],
      ["Ses Seviyesi", "49 dB"],
    ],
  },
  {
    ad: "Vestel AF 6600 Ankastre Fırın Seti",
    kategori: "Fırın ve Ankastre",
    marka: "Vestel",
    fiyat: 24500,
    indirimli: 19900,
    kisa: "Ankastre fırın, ocak ve davlumbaz üçlü set.",
    aciklama:
      "Fırın, cam ocak ve davlumbazdan oluşan üçlü ankastre set mutfağınızda bütünlüklü bir " +
      "görünüm sağlar. Turbo fanlı fırın ısıyı her rafa eşit dağıtır, aynı anda iki tepsi " +
      "pişirmenize imkân verir. Set hâlinde alındığında ayrı ayrı almaya göre avantajlıdır.",
    taksit: 12,
    garanti: "3 yıl Vestel garantisi",
    yeni: true,
    ton: "3E4C59",
    ozellikler: [
      ["Set İçeriği", "Fırın + Ocak + Davlumbaz"],
      ["Fırın Hacmi", "66 litre"],
      ["Ocak Tipi", "Cam seramik"],
      ["Enerji Sınıfı", "A"],
    ],
  },
  {
    ad: "Vestel Flama 12 Inverter Klima",
    kategori: "Klima",
    marka: "Vestel",
    fiyat: 21900,
    indirimli: 17500,
    kisa: "12.000 BTU, inverter teknolojisi, A++ enerji sınıfı.",
    aciklama:
      "12.000 BTU soğutma kapasitesi ile 25-35 m² arası odalar için uygundur. Inverter " +
      "teknolojisi kompresörü sürekli açıp kapatmak yerine devrini ayarlar; bu hem elektrik " +
      "tüketimini hem de sesi belirgin şekilde düşürür. Kurulum ekibimiz montajı üstlenir.",
    taksit: 12,
    garanti: "3 yıl Vestel garantisi",
    oneCikan: true,
    ton: "3E4C59",
    ozellikler: [
      ["Kapasite", "12.000 BTU"],
      ["Teknoloji", "Inverter"],
      ["Enerji Sınıfı", "A++"],
      ["Önerilen Alan", "25-35 m²"],
      ["Montaj", "Dahil"],
    ],
  },
  {
    ad: "Vestel 55U9600 55 inç 4K Smart TV",
    kategori: "Televizyon",
    marka: "Vestel",
    fiyat: 27900,
    indirimli: 22400,
    kisa: "55 inç 4K UHD ekran, dahili uydu alıcı, Smart TV.",
    aciklama:
      "55 inç 4K UHD ekranı ile film ve maç keyfini salonunuza taşır. Dahili uydu alıcısı " +
      "sayesinde ek cihaza gerek kalmaz. Smart TV özellikleriyle popüler yayın platformlarını " +
      "doğrudan televizyondan izleyebilirsiniz.",
    taksit: 12,
    garanti: "3 yıl Vestel garantisi",
    ton: "3E4C59",
    ozellikler: [
      ["Ekran Boyutu", "55 inç (139 cm)"],
      ["Çözünürlük", "3840 x 2160 (4K UHD)"],
      ["Uydu Alıcı", "Dahili"],
      ["Bağlantı", "Wi-Fi, 3x HDMI, 2x USB"],
    ],
  },
  {
    ad: "Vestel Sofia Çay Makinesi",
    kategori: "Küçük Ev Aletleri",
    marka: "Vestel",
    fiyat: 2450,
    indirimli: 1899,
    kisa: "Paslanmaz çelik demlik, 2 litre su haznesi.",
    aciklama:
      "Paslanmaz çelik demliği ve 2 litrelik su haznesiyle kalabalık misafirlikleri rahat " +
      "karşılar. Otomatik kapanma özelliği su bittiğinde cihazı korur.",
    garanti: "2 yıl Vestel garantisi",
    ton: "3E4C59",
    ozellikler: [
      ["Su Haznesi", "2 litre"],
      ["Demlik", "Paslanmaz çelik"],
      ["Güç", "2000 W"],
    ],
  },

  /* ---------------- Mobilya ---------------- */
  {
    ad: "Vilinze Roma Köşe Koltuk Takımı",
    kategori: "Köşe Takımı",
    marka: "Vilinze",
    fiyat: 68900,
    indirimli: 54900,
    kisa: "Yataklı ve sandıklı köşe takımı, keten kumaş.",
    aciklama:
      "Salonunuzun köşesini verimli kullanan, yataklı ve sandıklı tasarımıyla hem misafir " +
      "ağırlamaya hem de depolamaya çözüm sunar. Leke tutmayan keten kumaşı silinebilir. " +
      "Sert ahşap iskeleti uzun yıllar formunu korur. Kumaş ve renk seçenekleri için " +
      "mağazamıza uğrayabilirsiniz.",
    taksit: 12,
    garanti: "2 yıl üretici garantisi",
    oneCikan: true,
    ton: "8A6244",
    ozellikler: [
      ["Oturma Kapasitesi", "6 kişi"],
      ["Yatak Olma", "Var"],
      ["Sandık", "Var"],
      ["Kumaş", "Keten (leke tutmaz)"],
      ["İskelet", "Sert ahşap"],
      ["Ölçüler", "300 x 200 cm"],
    ],
  },
  {
    ad: "Venti Mobilya Aspen Yatak Odası Takımı",
    kategori: "Yatak Odası",
    marka: "Venti Mobilya",
    fiyat: 84500,
    indirimli: 69900,
    kisa: "Bazalı karyola, 6 kapaklı gardırop, komodin ve şifonyer.",
    aciklama:
      "Bazalı çift kişilik karyola, altı kapaklı geniş gardırop, iki komodin ve aynalı " +
      "şifonyerden oluşan tam takım. Ceviz desenli yüzeyi sıcak bir görünüm verir, mat " +
      "lake kapaklar parmak izi tutmaz. Montaj ekibimiz kurulumu evinizde yapar.",
    taksit: 12,
    garanti: "2 yıl üretici garantisi",
    oneCikan: true,
    ton: "8A6244",
    ozellikler: [
      ["Takım İçeriği", "Karyola + Gardırop + 2 Komodin + Şifonyer"],
      ["Yatak Ölçüsü", "160 x 200 cm"],
      ["Gardırop", "6 kapaklı, aynalı"],
      ["Baza", "Sandıklı"],
      ["Renk", "Ceviz / Mat krem"],
    ],
  },
  {
    ad: "Slims Nordic Yemek Odası Takımı",
    kategori: "Yemek Odası",
    marka: "Slims",
    fiyat: 52900,
    kisa: "Açılır masa, 6 sandalye ve vitrinli konsol.",
    aciklama:
      "Açılabilir masasıyla normalde 6, açıldığında 8 kişiyi ağırlar. Sandalyelerin " +
      "kumaşı silinebilir kaplamalıdır. Vitrinli konsol hem sergileme hem depolama sağlar. " +
      "İnce hatlı Nordic tasarım küçük salonlarda ferahlık hissi verir.",
    taksit: 12,
    garanti: "2 yıl üretici garantisi",
    ton: "8A6244",
    ozellikler: [
      ["Takım İçeriği", "Masa + 6 Sandalye + Konsol"],
      ["Masa Ölçüsü", "160 x 90 cm (200 cm açılır)"],
      ["Sandalye Kumaşı", "Silinebilir"],
      ["Malzeme", "MDF + masif ayak"],
    ],
  },
  {
    ad: "Turuncu Mobilya Campus Genç Odası",
    kategori: "Genç ve Çocuk Odası",
    marka: "Turuncu Mobilya",
    fiyat: 41900,
    indirimli: 34500,
    kisa: "Karyola, çalışma masası, kitaplık ve gardırop.",
    aciklama:
      "Ders çalışma ve dinlenme alanını bir arada kurgulayan genç odası takımı. Geniş " +
      "çalışma masası ve üstündeki kitaplık ile ders düzeni kolaylaşır. Yuvarlatılmış " +
      "köşeleri çocuk güvenliği düşünülerek tasarlanmıştır.",
    taksit: 9,
    garanti: "2 yıl üretici garantisi",
    yeni: true,
    ton: "8A6244",
    ozellikler: [
      ["Takım İçeriği", "Karyola + Masa + Kitaplık + Gardırop"],
      ["Yatak Ölçüsü", "100 x 200 cm"],
      ["Köşeler", "Yuvarlatılmış"],
      ["Renk Seçenekleri", "Beyaz-Mavi / Beyaz-Turuncu"],
    ],
  },
  {
    ad: "Arno Home Milano Üçlü Kanepe",
    kategori: "Oturma Grubu",
    marka: "Arno Home",
    fiyat: 28900,
    indirimli: 22900,
    kisa: "Üç kişilik, yataklı kanepe, kadife kumaş.",
    aciklama:
      "Tek başına ya da mevcut takımınızın yanında kullanabileceğiniz üçlü kanepe. " +
      "Yatak olma özelliği ile beklenmedik misafirlerde ek yatak ihtiyacını karşılar. " +
      "Kadife kumaşı yumuşak dokusuyla salonunuza sıcaklık katar.",
    taksit: 9,
    garanti: "2 yıl üretici garantisi",
    ton: "8A6244",
    ozellikler: [
      ["Oturma Kapasitesi", "3 kişi"],
      ["Yatak Olma", "Var"],
      ["Kumaş", "Kadife"],
      ["Ölçüler", "220 x 95 cm"],
    ],
  },
  {
    ad: "Castor Loft TV Ünitesi",
    kategori: "TV Ünitesi",
    marka: "Castor",
    fiyat: 14900,
    kisa: "180 cm genişlik, kapaklı ve raflı, LED aydınlatmalı.",
    aciklama:
      "180 cm genişliğindeki ünite 65 inçe kadar televizyonları rahatlıkla taşır. " +
      "Kapaklı bölmeleri kablo karmaşasını gizler, açık rafları dekoratif obje " +
      "sergilemeye uygundur. Arka LED aydınlatma akşamları hoş bir atmosfer yaratır.",
    taksit: 6,
    garanti: "2 yıl üretici garantisi",
    ton: "8A6244",
    ozellikler: [
      ["Genişlik", "180 cm"],
      ["TV Uyumu", "65 inçe kadar"],
      ["Aydınlatma", "LED"],
      ["Malzeme", "Suya dayanıklı MDF"],
    ],
  },
  {
    ad: "Arno Go Pratik Çekyat",
    kategori: "Oturma Grubu",
    marka: "Arno Go",
    fiyat: 12500,
    indirimli: 9750,
    kisa: "Tek hamlede açılan çekyat, sandıklı.",
    aciklama:
      "Kurulum gerektirmeden kutusundan çıktığı gibi kullanıma hazır. Tek hamlede " +
      "açılan mekanizması ile saniyeler içinde yatağa dönüşür. Alt sandığı yorgan ve " +
      "yastık için yer sağlar. Öğrenci evleri ve küçük daireler için ideal.",
    taksit: 6,
    garanti: "2 yıl üretici garantisi",
    stok: "siparise_bagli",
    ton: "8A6244",
    ozellikler: [
      ["Yatak Ölçüsü", "120 x 190 cm"],
      ["Sandık", "Var"],
      ["Kurulum", "Gerekmiyor"],
    ],
  },

  /* ---------------- Halı ---------------- */
  {
    ad: "Anadolu Desen Salon Halısı 200x290",
    kategori: "Salon Halısı",
    marka: "Arno Home",
    fiyat: 8900,
    indirimli: 6650,
    kisa: "200x290 cm, makine halısı, kaymaz taban.",
    aciklama:
      "Geleneksel Anadolu motiflerini modern renklerle yorumlayan salon halısı. " +
      "Yoğun kullanıma dayanıklı elyafı tüy dökmez, rengi solmaz. Kaymaz tabanı " +
      "parke ve seramik zeminlerde güvenle durmasını sağlar. Makinede yıkanabilir.",
    taksit: 6,
    oneCikan: true,
    ton: "9C5B4A",
    ozellikler: [
      ["Ölçü", "200 x 290 cm"],
      ["Tip", "Makine halısı"],
      ["Hav Yüksekliği", "12 mm"],
      ["Taban", "Kaymaz"],
      ["Yıkama", "Makinede yıkanabilir"],
    ],
  },
  {
    ad: "Modern Şönil Salon Halısı 160x230",
    kategori: "Salon Halısı",
    marka: "Arno Home",
    fiyat: 5400,
    kisa: "160x230 cm, şönil dokuma, sade desen.",
    aciklama:
      "Sade ve modern deseniyle her tarz mobilyayla uyum sağlar. Şönil dokuması " +
      "ayak altında yumuşak bir his verir. Orta boy salonlar ve yatak odaları için uygundur.",
    ton: "9C5B4A",
    ozellikler: [
      ["Ölçü", "160 x 230 cm"],
      ["Dokuma", "Şönil"],
      ["Taban", "Kaymaz"],
    ],
  },
  {
    ad: "Klasik Yolluk 80x300",
    kategori: "Yolluk",
    marka: "Arno Home",
    fiyat: 2200,
    indirimli: 1760,
    kisa: "80x300 cm, koridor ve mutfak için yolluk.",
    aciklama:
      "Koridor, mutfak ve antre için tasarlanmış dar ve uzun yolluk. Kaymaz tabanı " +
      "sayesinde yerinde durur. Kolay temizlenir yüzeyi yoğun geçiş alanları için uygundur.",
    ton: "9C5B4A",
    ozellikler: [
      ["Ölçü", "80 x 300 cm"],
      ["Kullanım Alanı", "Koridor, mutfak, antre"],
      ["Taban", "Kaymaz"],
    ],
  },
  {
    ad: "El Dokuma Görünümlü Kilim 120x180",
    kategori: "Kilim",
    marka: "Arno Home",
    fiyat: 3400,
    kisa: "120x180 cm, çift taraflı kullanım, geleneksel desen.",
    aciklama:
      "Geleneksel kilim desenini çift taraflı kullanılabilen pratik bir üretimle " +
      "buluşturur. İnce yapısı sayesinde kapı altlarında sorun çıkarmaz, katlanarak " +
      "kolayca saklanır.",
    ton: "9C5B4A",
    stok: "tukendi",
    ozellikler: [
      ["Ölçü", "120 x 180 cm"],
      ["Kullanım", "Çift taraflı"],
      ["Kalınlık", "6 mm"],
    ],
  },
];

const AFISLER = [
  {
    baslik: "Yaz Sonu Beyaz Eşya Fırsatları",
    altBaslik: "Seçili Vestel ürünlerinde %30'a varan indirim ve 12 taksit imkânı",
    baglanti: "/kategori/beyaz-esya",
    butonMetni: "Fırsatları Gör",
    ton: "3E4C59",
  },
  {
    baslik: "Evinizi Yeniden Kurun",
    altBaslik: "Yatak odası ve oturma grubu takımlarında özel fiyatlar",
    baglanti: "/kategori/mobilya",
    butonMetni: "Mobilyaları İncele",
    ton: "8A6244",
  },
  {
    baslik: "1963'ten Beri Malatya'da",
    altBaslik: "Üç kuşaktır aynı özenle, evinize değer katıyoruz",
    baglanti: "/hakkimizda",
    butonMetni: "Hikâyemiz",
    ton: "9C5B4A",
  },
];

const BANKA_HESAPLARI = [
  { bankaAdi: "Ziraat Bankası", iban: "TR00 0001 0000 0000 0000 0000 01" },
  { bankaAdi: "Vakıfbank", iban: "TR00 0001 5000 0000 0000 0000 02" },
  { bankaAdi: "Halkbank", iban: "TR00 0001 2000 0000 0000 0000 03" },
  { bankaAdi: "İş Bankası", iban: "TR00 0006 4000 0000 0000 0000 04" },
  { bankaAdi: "Garanti BBVA", iban: "TR00 0006 2000 0000 0000 0000 05" },
  { bankaAdi: "Yapı Kredi", iban: "TR00 0006 7000 0000 0000 0000 06" },
  { bankaAdi: "Akbank", iban: "TR00 0004 6000 0000 0000 0000 07" },
  { bankaAdi: "QNB Finansbank", iban: "TR00 0011 1000 0000 0000 0000 08" },
  { bankaAdi: "Denizbank", iban: "TR00 0013 4000 0000 0000 0000 09" },
];

const AYARLAR: Record<string, unknown> = {
  iletisim: {
    firmaAdi: "Boztepe Ev Gereçleri İnşaat San. Tic. A.Ş.",
    kisaAd: "Boztepe A.Ş.",
    telefon: "0422 321 20 36",
    whatsapp: "0507 464 12 74",
    eposta: "boztepehalep@hotmail.com",
    adres: "Malatya",
    haritaBaglantisi: "",
    calismaSaatleri: [
      { gun: "Pazartesi - Cumartesi", saat: "09:00 - 19:00" },
      { gun: "Pazar", saat: "Kapalı" },
    ],
  },
  sosyal: {
    facebook: "",
    instagram: "",
  },
  hakkimizda: {
    baslik: "1963'ten beri evinizin yanında",
    kurulusYili: 1963,
    ozet:
      "Boztepe Ev Gereçleri, 1963 yılından bu yana Malatya'da ev eşyası alanında hizmet veriyor. " +
      "Üç kuşaktır süren bu yolculukta değişmeyen tek şey, müşterimizi komşumuz gibi görmemiz oldu.",
    paragraflar: [
      "Boztepe Ev Gereçleri, 1963 yılında Malatya'da küçük bir dükkânda kuruldu. O gün beyaz eşya " +
        "denince sayılı ürün vardı; bugün ise mutfaktan salona, yatak odasından çocuk odasına kadar " +
        "evin her köşesi için çözüm sunuyoruz.",
      "Vestel yetkili bayisi olarak beyaz eşya ve elektronikte fabrika garantili ürünler sunuyor; " +
        "mobilya tarafında Vilinze, Venti, Slims, Arno Home, Turuncu Mobilya, Castor ve Arno Go gibi " +
        "markaların koleksiyonlarını showroomumuzda bir araya getiriyoruz. Halı reyonumuzda ise " +
        "salon halısından yolluğa geniş bir seçki bulabilirsiniz.",
      "Bizim için satış, ürünü teslim etmekle bitmiyor. Kurulum, garanti takibi ve satış sonrası " +
        "destek de işin parçası. Üç kuşaktır aynı şehirde, aynı isimle duruyorsak bunun sebebi budur.",
    ],
    degerler: [
      { baslik: "Üç kuşaklık tecrübe", metin: "1963'ten bugüne aynı ailenin işlettiği bir mağaza." },
      { baslik: "Garantili ürün", metin: "Yetkili bayilik ve fabrika garantisi ile satış." },
      { baslik: "Kurulum desteği", metin: "Beyaz eşya ve mobilyada montaj ekibimiz sizinle." },
      { baslik: "Şeffaf fiyat", metin: "Fiyat ve indirimler açıkça yazılı, sürpriz yok." },
    ],
  },
  seo: {
    baslik: "Boztepe A.Ş. — Malatya Beyaz Eşya, Mobilya ve Halı Mağazası",
    aciklama:
      "1963'ten beri Malatya'da beyaz eşya, mobilya ve halı. Vestel yetkili bayisi. " +
      "Güncel fiyatlar, indirimler ve taksit seçenekleriyle.",
  },
  duyuru: {
    aktif: true,
    metin: "Seçili beyaz eşyada %30'a varan indirim — detaylar için WhatsApp'tan yazın.",
    baglanti: "/kampanyalar",
  },
};

/* ------------------------------------------------------------------ */
/* Tohumlama                                                           */
/* ------------------------------------------------------------------ */

async function tohumla() {
  console.log(`→ Tohumlama başlıyor (${neonMu ? "Neon" : "PGlite"})...`);

  /* Var olan veriyi temizle - tohumlama tekrar çalıştırılabilir olmalı. */
  await db.delete(schema.talepKalemleri);
  await db.delete(schema.talepler);
  await db.delete(schema.urunOzellikleri);
  await db.delete(schema.urunGorselleri);
  await db.delete(schema.urunler);
  await db.delete(schema.markalar);
  await db.delete(schema.kategoriler);
  await db.delete(schema.afisler);
  await db.delete(schema.galeriGorselleri);
  await db.delete(schema.bankaHesaplari);
  await db.delete(schema.ayarlar);
  await db.delete(schema.yoneticiler);

  /* --- Kategoriler --- */
  const kategoriKimlikleri = new Map<string, number>();
  let kategoriSira = 0;

  for (const tanim of KATEGORILER) {
    const [ana] = await db
      .insert(schema.kategoriler)
      .values({
        ad: tanim.ad,
        slug: slugOlustur(tanim.ad),
        aciklama: tanim.aciklama,
        gorselUrl: yerTutucu(tanim.ad, tanim.ton),
        sira: kategoriSira++,
        anaSayfadaGoster: tanim.anaSayfada,
        seoBaslik: `${tanim.ad} — Boztepe A.Ş.`,
        seoAciklama: tanim.aciklama.slice(0, 155),
      })
      .returning({ id: schema.kategoriler.id });

    kategoriKimlikleri.set(tanim.ad, ana.id);

    let altSira = 0;
    for (const alt of tanim.altlar) {
      const [altKayit] = await db
        .insert(schema.kategoriler)
        .values({
          ad: alt.ad,
          slug: slugOlustur(alt.ad),
          aciklama: alt.aciklama ?? `${tanim.ad} kategorisindeki ${alt.ad.toLocaleLowerCase("tr")} ürünleri.`,
          ustKategoriId: ana.id,
          sira: altSira++,
        })
        .returning({ id: schema.kategoriler.id });

      kategoriKimlikleri.set(alt.ad, altKayit.id);
    }
  }
  console.log(`  ✓ ${kategoriKimlikleri.size} kategori`);

  /* --- Markalar --- */
  const markaKimlikleri = new Map<string, number>();
  let markaSira = 0;

  for (const marka of MARKALAR) {
    const [kayit] = await db
      .insert(schema.markalar)
      .values({
        ad: marka.ad,
        slug: slugOlustur(marka.ad),
        aciklama: marka.aciklama,
        logoUrl: yerTutucu(marka.ad, "1F1D1B"),
        sira: markaSira++,
      })
      .returning({ id: schema.markalar.id });

    markaKimlikleri.set(marka.ad, kayit.id);
  }
  console.log(`  ✓ ${markaKimlikleri.size} marka`);

  /* --- Ürünler --- */
  let urunSira = 0;
  for (const tanim of URUNLER) {
    const kategoriId = kategoriKimlikleri.get(tanim.kategori) ?? null;
    const markaId = markaKimlikleri.get(tanim.marka) ?? null;

    const [urun] = await db
      .insert(schema.urunler)
      .values({
        ad: tanim.ad,
        slug: slugOlustur(tanim.ad),
        stokKodu: `BZT-${String(1000 + urunSira)}`,
        kategoriId,
        markaId,
        kisaAciklama: tanim.kisa,
        aciklama: tanim.aciklama,
        fiyat: tanim.fiyat.toFixed(2),
        indirimliFiyat: tanim.indirimli ? tanim.indirimli.toFixed(2) : null,
        taksitSayisi: tanim.taksit ?? null,
        garantiSuresi: tanim.garanti ?? null,
        stokDurumu: tanim.stok ?? "stokta",
        oneCikan: tanim.oneCikan ?? false,
        yeniUrun: tanim.yeni ?? false,
        sira: urunSira++,
        seoBaslik: `${tanim.ad} — Boztepe A.Ş.`,
        seoAciklama: tanim.kisa,
        aramaMetni: aramaMetniUret([tanim.ad, tanim.marka, tanim.kategori, tanim.kisa]),
      })
      .returning({ id: schema.urunler.id });

    /* Her ürüne üç açıdan görsel - gerçek fotoğraflar gelene kadar yer tutucu. */
    for (let i = 0; i < 3; i++) {
      await db.insert(schema.urunGorselleri).values({
        urunId: urun.id,
        url: yerTutucu(`${tanim.ad} ${i + 1}`, tanim.ton),
        altMetin: `${tanim.ad} - görsel ${i + 1}`,
        sira: i,
      });
    }

    let ozellikSira = 0;
    for (const [ad, deger] of tanim.ozellikler) {
      await db.insert(schema.urunOzellikleri).values({
        urunId: urun.id,
        ad,
        deger,
        sira: ozellikSira++,
      });
    }
  }
  console.log(`  ✓ ${URUNLER.length} ürün (görsel ve özellikleriyle)`);

  /* --- Afişler --- */
  let afisSira = 0;
  for (const afis of AFISLER) {
    await db.insert(schema.afisler).values({
      baslik: afis.baslik,
      altBaslik: afis.altBaslik,
      gorselUrl: yerTutucu(afis.baslik, afis.ton),
      mobilGorselUrl: yerTutucu(afis.baslik, afis.ton),
      baglanti: afis.baglanti,
      butonMetni: afis.butonMetni,
      sira: afisSira++,
    });
  }
  console.log(`  ✓ ${AFISLER.length} afiş`);

  /* --- Galeri --- */
  for (let i = 0; i < 8; i++) {
    await db.insert(schema.galeriGorselleri).values({
      baslik: `Mağazamızdan ${i + 1}`,
      url: yerTutucu(`Magaza ${i + 1}`, i % 2 === 0 ? "8A6244" : "3E4C59"),
      sira: i,
    });
  }
  console.log("  ✓ 8 galeri görseli");

  /* --- Banka hesapları --- */
  let bankaSira = 0;
  for (const hesap of BANKA_HESAPLARI) {
    await db.insert(schema.bankaHesaplari).values({
      bankaAdi: hesap.bankaAdi,
      hesapSahibi: "Boztepe Ev Gereçleri İnşaat San. Tic. A.Ş.",
      iban: hesap.iban,
      sira: bankaSira++,
    });
  }
  console.log(`  ✓ ${BANKA_HESAPLARI.length} banka hesabı (IBAN'lar yer tutucu)`);

  /* --- Ayarlar --- */
  for (const [anahtar, deger] of Object.entries(AYARLAR)) {
    await db.insert(schema.ayarlar).values({ anahtar, deger });
  }
  console.log(`  ✓ ${Object.keys(AYARLAR).length} ayar kaydı`);

  /* --- Yönetici --- */
  const eposta = process.env.ADMIN_EPOSTA ?? "admin@boztepeas.com";
  const sifre = process.env.ADMIN_SIFRE ?? gecerliSifreUret();

  await db.insert(schema.yoneticiler).values({
    eposta,
    sifreOzeti: await sifreOzetle(sifre),
    adSoyad: "Site Yöneticisi",
    rol: "admin",
  });

  console.log("\n────────────────────────────────────────────");
  console.log("  YÖNETİCİ GİRİŞ BİLGİLERİ");
  console.log("  Adres  : /admin/giris");
  console.log(`  E-posta: ${eposta}`);
  console.log(`  Şifre  : ${sifre}`);
  console.log("  (İlk girişten sonra şifreyi değiştirin.)");
  console.log("────────────────────────────────────────────\n");
}

tohumla()
  .then(async () => {
    await pglite?.close();
    console.log("✓ Tohumlama tamamlandı.");
    process.exit(0);
  })
  .catch(async (hata) => {
    console.error("✗ Tohumlama başarısız:", hata);
    await pglite?.close();
    process.exit(1);
  });
