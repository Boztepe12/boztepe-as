# İlerleme Takibi

Bu dosya, oturum bağlamı sıfırlansa bile işin kaldığı yerden sürdürülebilmesi için tutuluyor.
Yeni bir oturum bu dosyayı ve `CLAUDE.md`'yi okuyarak devam edebilir.

---

## ⏸️ NEREDE KALDIM (son güncelleme: 29 Ağustos 2026, gece)

**Vitrin bitti. Admin panelinde ürün yönetimi de bitti ve uçtan uca denendi.
Sıradaki iş: talep (teklif) yönetimi ekranları.**

### Şu an çalışan hâli
`npm run dev` → http://localhost:3000 açılıyor, tüm vitrin sayfaları gerçek veriyle geliyor.
Yönetici girişi çalışıyor: `/admin/giris` → `admin@boztepeas.com` / `BoztepeAdmin2026`
(yalnızca yerel geliştirme şifresi). Giriş yapılmadan `/admin` adresine gidilirse giriş
ekranına yönlendiriliyor; bu test edildi.

### Admin panelinde BİTEN
- `lib/auth/giris.ts` — giriş/çıkış sunucu eylemleri, deneme sınırlama, zamanlama saldırısına
  karşı sabit süreli şifre karşılaştırma
- `lib/auth/koruma.ts` — `oturumZorunlu`, `adminZorunlu`, `eylemIcinOturum`
- `app/admin/giris/` — giriş ekranı ve formu
- `app/admin/(panel)/layout.tsx` — oturum koruması + panel kabuğu
- `app/admin/(panel)/page.tsx` — özet ekranı (sayı kutuları, dikkat gerektirenler, son talepler)
- `components/admin/panel-kabuk.tsx` — kenar menü, mobil çekmece, çıkış
- `components/admin/panel-parcalari.tsx` — `SayfaBasligi`, `OzetKutusu`, `Panel`,
  `TalepDurumRozeti`, `TabloSarmali`
- `lib/sorgular/admin.ts` — panel özeti, ürün/talep listeleme, form seçenekleri, tüm listeler
- `lib/storage/index.ts` — görsel yükleme soyutlaması (Cloudinary varsa Cloudinary,
  yoksa `public/yuklenenler` altına yerel disk)
- `lib/eylemler/admin/urun.ts` — ürün kaydet/sil, durum değiştir, görsel yükle/sil/sırala,
  toplu işlem. Hepsi çalışan sunucuda gerçek isteklerle denendi.
- **Ürün yönetimi ekranları (yeni):**
  - `app/admin/(panel)/urunler/page.tsx` — liste; arama, kategori/marka/durum filtresi,
    sayfalama, satır içi yayın anahtarı, öne çıkarma yıldızı, toplu işlem, boş durum
  - `app/admin/(panel)/urunler/yeni/page.tsx` ve `.../[id]/page.tsx`
  - `components/admin/urun-formu.tsx` — tüm alanlar + teknik özellik satırları + SEO
  - `components/admin/gorsel-yonetimi.tsx` — çoklu yükleme, sıralama, silme, kapak rozeti
  - `components/admin/urun-filtre-cubugu.tsx`, `urun-listesi.tsx`, `panel-sayfalama.tsx`

**Denenenler (çalışan sunucuda, gerçek HTTP istekleriyle):** ürün ekleme, güncelleme,
silme; Türkçe fiyat yazımının (`12.345,50`) doğru saklanması; slug ve arama metninin
Türkçe karakterlerle doğru üretilmesi; indirimli fiyat > fiyat doğrulaması; görsel yükleme,
sıralama, silme; ürün silinince görsel dosyalarının diskten de temizlenmesi; oturumsuz
eylem çağrısının reddedilmesi. Tohum verisi bozulmadı (18 ürün).

### 👉 SIRADAKİ SOMUT ADIM
`app/admin/(panel)/talepler/` altındaki ekranları yaz:

1. `page.tsx` — talep listesi. Sorgu hazır: `yoneticiTalepleri(durum?, sayfa?)`
   (durum sekmeleri için `sayimlar` da dönüyor). Rozet bileşeni `TalepDurumRozeti`
   ve `TALEP_DURUM_LISTESI` `components/admin/panel-parcalari.tsx` içinde hazır.
2. `[id]/page.tsx` — talep detayı: müşteri bilgisi, kalemler (`talepGetir(id)`),
   WhatsApp'tan yanıt bağlantısı (`whatsappBaglantisi` yardımcısı var), durum değiştirme
   ve yönetici notu.
3. `lib/eylemler/admin/talep.ts` — **henüz yok, yazılacak**: `talepDurumGuncelle(id, durum)`,
   `talepNotuKaydet(id, not)`, `talepSil(id)`. Örnek olarak `lib/eylemler/admin/urun.ts`
   deseni izlenmeli (`eylemIcinOturum()` + zod + `revalidatePath`).

Sonra sırasıyla: kategoriler → markalar → afişler → galeri → banka → ayarlar →
hesap (şifre değiştirme). Listeleme sorguları `lib/sorgular/admin.ts` içinde hazır
(`tumKategoriler`, `tumMarkalar`, `tumAfisler`, `tumGaleri`, `tumBankaHesaplari`);
yalnızca kendi sunucu eylemleri ve ekranları yazılacak.

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

### Admin paneli — devam ediyor
- [x] Giriş ekranı ve oturum koruması
- [x] Panel yerleşimi ve özet ekranı
- [x] Ürün yönetimi (liste, filtre, form, fotoğraflar, toplu işlem) — çalışırken denendi
- [ ] **Talep yönetimi (durum takibi) — SIRADAKİ İŞ** (sorgular hazır, eylemler ve
      ekranlar yazılacak)
- [ ] Kategori ve marka yönetimi
- [ ] Afiş / kampanya yönetimi
- [ ] Galeri ve banka hesapları
- [ ] Site ayarları
- [ ] Şifre değiştirme

### Kapanış
- [ ] Üretim derlemesi (`npm run build`) hatasız — henüz hiç çalıştırılmadı
- [ ] Erişilebilirlik ve mobil kontrolü
- [ ] Deploy notları (`README.md`)

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
