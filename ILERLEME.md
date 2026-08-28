# İlerleme Takibi

Bu dosya, oturum bağlamı sıfırlansa bile işin kaldığı yerden sürdürülebilmesi için tutuluyor.
Bir adım bittiğinde kutusu işaretlenir ve kısa bir not düşülür.

## Durum özeti

Yerel geliştirme tamamen ayakta: PGlite veritabanı kurulu, şema uygulanmış ve örnek veriyle
doldurulmuş. Harici hiçbir hesap gerekmeden `npm run dev` ile çalışılabilir.

**Yerel yönetici girişi:** `admin@boztepeas.com` / `BoztepeAdmin2026` (yalnızca geliştirme)

## Komutlar

```bash
npm run dev           # Geliştirme sunucusu
npm run build         # Üretim derlemesi
npm run db:generate   # Şema değişince SQL migrasyonu üret
npm run db:migrate    # Migrasyonları uygula (PGlite veya Neon)
npm run db:seed       # Örnek veriyi yükle (mevcut veriyi siler)
npm run db:reset      # Veritabanını sıfırla + migrate + seed
npm run db:studio     # Drizzle Studio
```

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
- [ ] Sorgu katmanı (`lib/sorgular/`) — ürün, kategori, marka, ayar okuma
- [ ] Görsel depolama soyutlaması (`lib/storage/`) — yerel disk / Cloudinary

### Vitrin
- [ ] Kök yerleşim, fontlar, başlık ve altbilgi
- [ ] Ana sayfa
- [ ] Kategori ve ürün listeleme + filtreleme
- [ ] Ürün detay sayfası
- [ ] Arama
- [ ] Teklif sepeti + talep formu
- [ ] Hakkımızda, galeri, iletişim, kampanyalar
- [ ] SEO: sitemap, robots, JSON-LD

### Admin paneli
- [ ] Giriş ekranı ve oturum koruması
- [ ] Panel yerleşimi ve özet ekranı
- [ ] Ürün yönetimi (liste, ekle, düzenle, görsel, özellik)
- [ ] Kategori ve marka yönetimi
- [ ] Afiş / kampanya yönetimi
- [ ] Talep yönetimi (durum takibi)
- [ ] Galeri ve banka hesapları
- [ ] Site ayarları
- [ ] Şifre değiştirme

### Kapanış
- [ ] Üretim derlemesi hatasız
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
