# İlerleme Takibi

Bu dosya, oturum bağlamı sıfırlansa bile işin kaldığı yerden sürdürülebilmesi için tutuluyor.
Yeni bir oturum bu dosyayı ve `CLAUDE.md`'yi okuyarak devam edebilir.

---

## ⏸️ NEREDE KALDIM (son güncelleme: 30 Ağustos 2026)

**Vitrin ve admin paneli bitti. Panelin on ekranı da çalışıyor ve gerçek isteklerle
denendi. Üretim derlemesi (`npm run build`) hatasız. Sıradaki iş: yayına alma (deploy)
hazırlığı ve kullanıcıdan beklenen içeriklerin girilmesi.**

### Şu an çalışan hâli
`npm run dev` → http://localhost:3000. Vitrinin tamamı ve yönetim panelinin tamamı
gerçek veriyle çalışıyor. Yönetici girişi: `/admin/giris` → `admin@boztepeas.com` /
`BoztepeAdmin2026` (yalnızca yerel geliştirme şifresi). Giriş yapılmadan panele
gidilirse giriş ekranına yönlendiriliyor.

### Panelde biten ekranlar
| Ekran | Neler yapılabiliyor |
|---|---|
| Özet | Sayılar, dikkat gerektiren ürünler, son talepler |
| Ürünler | Arama, kategori/marka/durum filtresi, sayfalama, satır içi yayın anahtarı, öne çıkarma, toplu yayınla/gizle/sil |
| Ürün formu | Tüm alanlar, Türkçe fiyat yazımı, teknik özellik satırları, SEO, çoklu fotoğraf yükleme/sıralama/silme |
| Talepler | Durum sekmeleri ve sayaçlar, toplu durum değişimi |
| Talep detayı | Müşteri bilgisi, hazır mesajlı WhatsApp bağlantısı, kalemler ve tutar, durum, yönetici notu |
| Kategoriler | İki seviyeli liste, yayın ve "ana sayfada göster" anahtarları, görsel, silme kuralları |
| Markalar | Liste, logo, yayın anahtarı, silme kuralları |
| Afişler | Liste, form (tarih aralığı, bağlantı, buton), masaüstü + mobil görsel |
| Galeri | Çoklu yükleme, başlık, yayın durumu, sıralama, silme |
| Banka hesapları | Satır içi düzenleme, IBAN doğrulama (TR + 24 hane) |
| Site ayarları | İletişim, çalışma saatleri, duyuru çubuğu, sosyal medya, hakkımızda metinleri, SEO |
| Hesabım | Ad/e-posta güncelleme, şifre değiştirme |

Sunucu eylemleri: `lib/eylemler/admin/` altında `urun.ts`, `talep.ts`, `katalog.ts`
(kategori + marka), `icerik.ts` (afiş + galeri + banka), `ayarlar.ts` (site ayarları +
hesap). Hepsi `eylemIcinOturum()` ile korunuyor, zod ile doğruluyor ve `revalidatePath`
ile vitrini tazeliyor.

### 👉 SIRADAKİ SOMUT ADIM
Yayına alma hazırlığı. Sırasıyla:

1. **Neon veritabanı**: ücretsiz proje açılıp `DATABASE_URL` alınacak, `.env.local` ve
   Vercel ortam değişkenlerine yazılacak, `npm run db:migrate` + `npm run db:seed`
   çalıştırılacak. (Seed yönetici hesabını `.env.local` içindeki `ADMIN_EPOSTA` /
   `ADMIN_SIFRE` değerlerinden kuruyor — canlıda güçlü bir şifre girilmeli.)
2. **Cloudinary**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
   Anahtarlar yokken yüklenen görseller `public/yuklenenler` altına düşüyor ve Vercel'in
   dosya sistemi salt okunur olduğu için canlıda çalışmaz.
3. **`OTURUM_GIZLI_ANAHTAR`**: canlı için en az 32 karakterlik yeni bir rastgele değer.
4. **Vercel projesi**: repo bağlanacak, ortam değişkenleri girilecek, ilk deploy.
5. **README'ye deploy notları** yazılacak (şu an yok).
6. Kullanıcıdan gelen içerikler panele girilecek: logo, gerçek fotoğraflar, IBAN listesi,
   iletişim bilgileri, hakkımızda metni.

Kod tarafında bekleyen bir eksik yok; panelin ekranları tamamlandı.

### Bilinen tuzaklar (tekrar düşmemek için)
- **PGlite tek yazıcıdır.** Dev sunucusu çalışırken `db:seed` / `db:migrate` çalışmaz.
- **Dev sunucusunu zorla kapatma.** `taskkill /F` geride `postmaster.pid` bırakıyor ve
  veri dizinini bozabiliyor. Kilit kalırsa `npm run db:unlock`, dizin bozulduysa
  `npm run db:reset`.
- **lucide-react 1.x marka ikonlarını kaldırdı** (Instagram, Facebook, WhatsApp yok).
  Bunlar `components/site/marka-simgeleri.tsx` içinde satır içi SVG olarak duruyor.
- **PGlite paketlenmemeli**; `next.config.ts` içinde `serverExternalPackages` ile dışarıda.
- **Tailwind v4**: renk/yarıçap/gölge token'ları `@theme` içinde tanımlı ve otomatik
  utility üretiyor (`bg-kiremit`, `rounded-kart`, `font-baslik`…). v3'ün `bg-[--degisken]`
  sözdizimini kullanma.
- **`dotenv/config` yalnızca `.env` okur**, bizim değerler `.env.local`'da. Betikler
  ikisini de yüklüyor.
- **Drizzle birleşim tipi**: iki sürücünün tipini birleştirmek `.returning()` gibi
  metotlarda TypeScript'i kilitliyor; `lib/db/index.ts` tek tip üzerinden ilerliyor.
- **Yeni route dosyası eklenince Turbopack bazen görmüyor**: dosya diskte olduğu hâlde
  adres 404 dönüyor. Dosyaya dokunmak (`touch`) ya da dev sunucusunu yeniden başlatmak
  yetiyor. Yani "404" mutlaka kod hatası demek değil.
- **Sunucu eylemi hata fırlatırsa** (örneğin oturum düşmüşse `eylemIcinOturum` fırlatır)
  istemci tarafında yakalanmazsa ekran hata sınırına düşüyor. Panel bileşenlerinde her
  eylem çağrısı `try/catch` içinde ve kullanıcıya anlaşılır bir bildirim gösteriliyor.
- **Panel listeleri iki düzen taşıyor**: telefon için kart (`md:hidden`), tablet ve üstü
  için tablo (`hidden md:block`). Yeni bir liste eklerken ikisini birden yazmak gerekiyor;
  yalnızca tablo yazılırsa telefonda yana kaydırma çıkar.
- **`generateStaticParams` kategori/marka sayfalarında yok, bilerek.** Bu sayfalar
  `searchParams` okuduğu için Next hiçbir koşulda statik HTML üretmiyor (derleme çıktısında
  o adresler için `.html` dosyası oluşmuyor). Eklemek yalnızca derlemede boş bir sorgu demek.
- **Zorla kapatmanın bedeli gerçek**: bu oturumda dev sunucusu iki kez `taskkill /F` ile
  kapatıldı ve PGlite dizini ikisinde de bozuldu. `npm run db:onar` onarıyor ama veri
  (örnek talepler) gidiyor. Mümkünse sunucuyu Ctrl+C ile durdurun.
- **Fiyatlar Türkçe yazılıyor**: `12.345,50` girdisi sunucuda `12345.50`'ye çevriliyor
  (`paraAlani` şeması). Formda gösterirken ters çevirmek gerekiyor — `urun-formu.tsx`
  içindeki `paraGoster` bunu yapıyor. Veritabanı değerini doğrudan input'a basmayın,
  binlik ayırıcı temizliği "24999.00" değerini 2.499.900 yapar.

---

## Durum özeti

Yerel geliştirme tamamen ayakta: PGlite veritabanı kurulu, şema uygulanmış ve örnek veriyle
doldurulmuş. Harici hiçbir hesap gerekmeden `npm run dev` ile çalışılabilir.

**Yerel yönetici girişi:** `admin@boztepeas.com` / `BoztepeAdmin2026` (yalnızca geliştirme)

## Sohbet geçmişi

Bu proje üzerindeki Claude Code konuşmaları `sohbet-gecmisi/` klasörüne kaydediliyor
(okunabilir `.md` + ham `.jsonl`). Klasör `.gitignore` içinde, yani yerelde kalır.
Ayrıntı için `sohbet-gecmisi/BENIOKU.md`.

- Kaydı tazele: `npm run sohbet:kaydet`
- Konuşmayı kaldığı yerden sürdür: proje kökünde `claude --continue`

## Komutlar

```bash
npm run dev           # Geliştirme sunucusu
npm run build         # Üretim derlemesi
npm run db:generate   # Şema değişince SQL migrasyonu üret
npm run db:migrate    # Migrasyonları uygula (PGlite veya Neon)
npm run db:seed       # Örnek veriyi yükle (mevcut veriyi siler)
npm run db:reset      # Veritabanını sıfırla + migrate + seed
npm run db:studio     # Drizzle Studio
npm run db:unlock     # Kalmış PGlite kilidini temizle
```

### PGlite hakkında bilinmesi gerekenler

PGlite tek yazıcılıdır: dev sunucusu çalışırken `db:seed`, `db:migrate` veya başka bir
betik aynı `.pglite` dizinini açamaz. Önce dev sunucusunu durdurun.

PGlite ayrıca yalnızca **düzgün kapatılırsa** sağlam kalır. Süreç zorla sonlandırılırsa
(`taskkill /F`, bilgisayarın ani kapanması) veri dizini bozulabiliyor. Bozulmanın belirtisi
yanıltıcıdır: sunucu sorunsuz ayağa kalkar, ama her sayfa 500 döner ve logda
`Failed query ... cause: Aborted()` görünür.

Bunun için üç katmanlı koruma var:

1. **`npm run dev` öncesi otomatik kontrol** (`scripts/db-kontrol.mjs`, `predev` olarak
   bağlı). Dizini yoklar; okunamıyorsa `.pglite-bozuk-<zaman>` adına taşıyıp sıfırdan
   kurar. Yönetici bilgileri `.env.local` içindeki `ADMIN_EPOSTA` / `ADMIN_SIFRE`
   değerlerinden geldiği için giriş bilgisi her onarımda aynı kalır.
2. **Çalışan sunucu koruması.** Dizinin meşgul olması da tıpkı bozulma gibi `Aborted()`
   verdiği için kontrol, önce dev portuna bağlanmayı deneyip çalışan bir sunucu olup
   olmadığına bakar; varsa hiçbir şeye dokunmadan çıkar. Dizin yeniden adlandırılamıyorsa
   da (yani kullanımdaysa) silmek yerine hata verip durur.
3. **Ctrl+C kancası.** `lib/db/index.ts`, SIGINT/SIGTERM yakalayıp PGlite'ı düzgün
   kapatır; normal durdurma artık bozulmaya yol açmaz.
4. **Kilit sahipliği.** Dizini açan süreç kimliğini `.pglite-sahip.json` dosyasına yazar.
   Kilit yalnızca o süreç artık yaşamıyorsa temizlenir; böylece Next'in yardımcı süreçleri
   çalışan sunucunun kilidini "sahipsiz" sanıp silemez (`lib/db/kilit.ts`).

Elle müdahale gerekirse: `npm run db:onar` (kontrol + gerekiyorsa onarım),
`npm run db:unlock` (yalnızca kilidi temizle), `npm run db:reset` (koşulsuz sıfırla).
Üretimde Neon kullanıldığı için bu kısıtların hiçbiri canlı siteyi ilgilendirmez.

## Adımlar

### Temel altyapı
- [x] Next.js 16 + TypeScript + Tailwind v4 iskeleti
- [x] Tasarım dili token'ları (`app/globals.css`) — Sıcak Minimal paleti
- [x] Türkçe duyarlı yardımcılar (`lib/utils/index.ts`) — slug, arama, fiyat, WhatsApp
- [x] Veritabanı şeması (`lib/db/schema.ts`) — 12 tablo
- [x] Çift sürücülü bağlantı (`lib/db/index.ts`) — PGlite (yerel) / Neon (üretim)
- [x] Migrasyon ve tohumlama betikleri
- [x] Oturum katmanı (`lib/auth/`) — bcrypt + jose JWT

### Veri erişimi
- [x] Sorgu katmanı (`lib/sorgular/`) — ürün, kategori, marka, ayar, admin
- [x] Görsel depolama soyutlaması (`lib/storage/`) — yerel disk / Cloudinary

### Vitrin — tamamlandı
- [x] Kök yerleşim, fontlar, başlık ve altbilgi
- [x] Ana sayfa (afiş karuseli, kategoriler, indirimliler, öne çıkanlar, markalar)
- [x] Ürün listeleme + filtreleme (marka, fiyat, indirim, stok) + sıralama + sayfalama
- [x] Kategori ve marka sayfaları
- [x] Ürün detay sayfası (galeri, teknik özellikler, benzer ürünler, JSON-LD)
- [x] Arama — Türkçe karakter duyarsız, doğrulandı
- [x] Teklif sepeti + talep formu (fiyat sunucuda doğrulanıyor)
- [x] Kampanyalar, hakkımızda, galeri, iletişim, markalar, 404
- [x] SEO: sitemap (53 girdi), robots

### Admin paneli — tamamlandı
- [x] Giriş ekranı ve oturum koruması
- [x] Panel yerleşimi ve özet ekranı
- [x] Ürün yönetimi (liste, filtre, form, fotoğraflar, toplu işlem)
- [x] Talep yönetimi (durum takibi, yönetici notu, WhatsApp'tan dönüş)
- [x] Kategori ve marka yönetimi
- [x] Afiş / kampanya yönetimi
- [x] Galeri ve banka hesapları
- [x] Site ayarları
- [x] Hesap bilgileri ve şifre değiştirme

### Kapanış
- [x] Üretim derlemesi (`npm run build`) hatasız — 42 sayfa üretiliyor, uyarı yok
- [x] `npx eslint` ve `npx tsc --noEmit` temiz
- [x] Mobil uyum: paneldeki bütün listeler telefonda kart, tablet/masaüstünde tablo;
      dokunma hedefleri telefonda büyütüldü. Vitrin zaten mobil öncelikliydi.
- [ ] Erişilebilirlik ve gerçek cihaz kontrolü (tarayıcıda gözle görülmedi — projede
      Playwright/Puppeteer yok, doğrulama kod ve HTML çıktısı üzerinden yapıldı)
- [ ] Deploy notları (`README.md`)
- [ ] Neon + Cloudinary + Vercel kurulumu

## Kullanıcıdan beklenenler

Bunlar gelmeden de site tam çalışıyor; yer tutucularla ilerleniyor.

1. Logo dosyası
2. Marka rengi onayı (öneri: krem `#FAF7F2` + terracotta `#B4553A`)
3. Firma bilgileri: tam adres, telefon, çalışma saatleri, Google Maps bağlantısı
4. Gerçek IBAN listesi (şu an yer tutucu)
5. "Hakkımızda" metni onayı (taslak yazıldı)
6. Gerçek ürün fotoğrafları
7. Yönetici e-posta adresi
8. Neon `DATABASE_URL` ve Cloudinary anahtarları (deploy anında)
9. Domain yönlendirme kararı
