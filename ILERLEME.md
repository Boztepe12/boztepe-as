# İlerleme Takibi

Bu dosya, oturum bağlamı sıfırlansa bile işin kaldığı yerden sürdürülebilmesi için tutuluyor.
Yeni bir oturum bu dosyayı ve `CLAUDE.md`'yi okuyarak devam edebilir.

---

## ⏸️ NEREDE KALDIM (son güncelleme: 29 Ağustos 2026)

**Vitrin (müşteri tarafı) bitti ve çalışıyor. Admin panelinin temeli atıldı, ekranları yarım.**

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
  toplu işlem. **Yazıldı ve derleniyor ama henüz hiçbir ekran tarafından kullanılmıyor,
  yani çalışırken denenmedi.**

### 👉 SIRADAKİ SOMUT ADIM
`app/admin/(panel)/urunler/` altındaki ekranları yaz. Sunucu eylemleri ve sorgular hazır,
tek eksik arayüz:

1. `app/admin/(panel)/urunler/page.tsx` — ürün listesi
   (`yoneticiUrunleri()` kullanılacak; arama, kategori/marka/durum filtresi, sayfalama,
   satır içi yayınla-gizle anahtarı, toplu seçim)
2. `app/admin/(panel)/urunler/yeni/page.tsx` ve `.../[id]/page.tsx` — ürün formu
   (`formSecenekleri()` ile kategori/marka listesi, `urunKaydet()` ile kayıt;
   düzenleme ekranında görsel yükleme ve özellik satırları da olacak)
3. Ortak form bileşeni: `components/admin/urun-formu.tsx` (istemci bileşeni)

Sonra sırasıyla: talepler → kategoriler → markalar → afişler → galeri → banka → ayarlar →
hesap (şifre değiştirme). Hepsi için sorgular `lib/sorgular/admin.ts` içinde hazır;
yalnızca kendi sunucu eylemleri (`lib/eylemler/admin/*.ts`) ve ekranları yazılacak.

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
- [ ] **Ürün yönetimi — SIRADAKİ İŞ** (sunucu eylemleri hazır, ekranlar yazılacak)
- [ ] Kategori ve marka yönetimi
- [ ] Afiş / kampanya yönetimi
- [ ] Talep yönetimi (durum takibi)
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
