# CLAUDE.md — Boztepe A.Ş. Web Sitesi

Bu dosya, projeyle çalışan Claude Code oturumlarına bağlam sağlar.

## Proje

[boztepeas.com](https://www.boztepeas.com/) için sıfırdan yeni web sitesi + admin paneli.
Boztepe Ev Gereçleri İnşaat San. Tic. A.Ş. — Malatya, 1963'ten beri.

Üç ürün kolu:
- **Beyaz eşya** — Vestel bayisi (buzdolabı, çamaşır/bulaşık makinesi, fırın, klima, TV)
- **Mobilya** — Vilinze, Venti Mobilya, Slims, Arno Home, Turuncu Mobilya, Castor, Arno Go
- **Halı**

Mevcut site vitrin tipi: fiyat yok, ürün detayı yok, sipariş WhatsApp'tan alınıyor,
footer'da 9 banka hesabı listeli. İletişim: (0422) 321 20 36, WhatsApp 0507 464 12 74,
boztepehalep@hotmail.com.

## Verilmiş kararlar

Bunlar kullanıcıyla birlikte kararlaştırıldı, yeniden tartışmaya açma.

### Teknoloji — "tamamen ücretsiz" kısıtı
Kullanıcı maliyetin sıfır kalmasını istedi. Seçimler buna göre yapıldı:

| Katman | Seçim |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Stil | Tailwind CSS v4 |
| Veritabanı | Neon Postgres (ücretsiz katman) |
| ORM | Drizzle |
| Lokal geliştirme DB | PGlite — harici hesap gerekmeden Postgres uyumlu |
| Auth | Kendi oturum katmanımız: bcrypt + `jose` ile imzalı JWT, httpOnly cookie |
| Görsel depolama | Cloudinary (ücretsiz 25 GB) |
| Hosting | Vercel Hobby |

**Supabase kullanılmayacak.** Nedeni: kullanıcının ücretsiz kotası olan 2 aktif proje
zaten `smart-menu` tarafından dolu ve o projelere dokunulmaması istendi. Ayrıca ücretsiz
Supabase projeleri bir hafta hareketsizlikte duraklatılıyor, bu ticari bir mağaza sitesi
için kabul edilemez.

### Satış modeli
Katalog + WhatsApp sipariş. Fiyatlar, indirimler, taksit bilgisi ve stok durumu sitede
görünür. Müşteri bir "teklif sepeti" oluşturup WhatsApp'tan veya form ile sipariş talebi
gönderir; talepler admin panelinde durum takibiyle listelenir. Online ödeme **yok**, ama
altyapı ileride eklenebilecek şekilde kurulacak.

### Tasarım dili — "Sıcak Minimal"
- Zemin krem `#FAF7F2`, metin antrasit `#1F1D1B`, accent terracotta `#B4553A`
- Bol boşluk, büyük ürün görselleri, ince serif başlık + net sans gövde
- Mobilya ve halıyı güzel gösterirken beyaz eşya kartlarında fiyat/indirim etiketi net okunur
- Sade, göz yormayan, mobil öncelikli

Admin paneli de aynı sadelikte olmalı — kullanıcı "admin sistemi de bir o kadar rahat
olacak kullanımı" dedi. Ürün, fotoğraf, fiyat ve indirim girişi teknik bilgi gerektirmeden
yapılabilmeli.

## Çalışma kuralları

- Bu proje **tamamen bağımsızdır**. Kullanıcının diğer repolarına (`smart-menu`,
  `company-website`, `EnginKuyumculuk`, `Adisyon`, `OverfitSoft-*`) ve onların altyapısına
  kesinlikle dokunulmayacak. Sadece kod konvansiyonu öğrenmek için okunabilir.
- **Tek istisna Stok Yönetimi bağlantısı** (2026-10-09, kullanıcının isteği): ürün, fiyat ve stok
  Boztepe'nin stok sisteminden (Stok Yönetimi, `Boztepe12/stok-yonetimi-*`) **yalnızca onun web
  sitesi API'si ve webhook'ları üzerinden** gelir. O sistemin veritabanına ya da koduna buradan
  dokunulmaz.
- Türkçe içerik ve Türkçe arayüz esas. Arama Türkçe karakter duyarsız çalışmalı.
- Git: `main` dalı, remote `pers:Boztepe12/boztepe-as.git` (SSH alias `pers` = kişisel hesap).

## Durum

Vitrin ve yönetim paneli tamamlandı; `npm run build` hatasız çalışıyor. Nerede kalındığı,
ekran ekran ne yapıldığı ve bilinen tuzaklar `ILERLEME.md` içinde tutuluyor — yeni bir
oturum önce onu okumalı.

## Stok Yönetimi bağlantısı

Stok sisteminin adı artık **Selstok** (repolar `OverfitSoft/smart-store-*`, panel
https://selstok.vercel.app; eski `stok-yonetimi-steel.vercel.app` adresi yönlendirir).

`lib/stok/` — `istemci.ts` (API: `/api/v1/products`, `/products/{barkod}` → `{data}`,
`/categories`, `/ping`),
`esitle.ts` (eşitleme kuralları), `imza.ts` (webhook imzası). Admin ekranı `/admin/stok`
("Stok Bağlantısı"), ürün düzenleme sayfasında "Stok sisteminden" kutusu.

- Ürün `urunler.stok_barkod` ile eşlenir; yoksa stok kodu bu barkod olan elle açılmış ürüne
  bağlanır; o da yoksa yeni ürün açılır — `stok_entegrasyonu.yeni_urunleri_yayinla` kapalıyken
  **gizli** gelir, yönetici seçip yayınlar.
- Stok sistemi yalnızca stok miktarını, liste fiyatını ve ürün bazında açıksa fiyatı
  (`fiyat_stoktan`) ve stok durumunu (`stok_durumu_stoktan`; "siparişe bağlı" korunur) ve
  **kategoriyi** yazar. Ad, açıklama, fotoğraf, marka, öne çıkarma, yayın sitenin yöneticisinindir.
- Stokta silinen / web sitesinden kaldırılan ürün `stok_kaldirildi = true` ve gizli olur; önceki
  yayın durumu `stok_onceki_aktif`'te saklanır, ürün geri gelince ona döner (ör. kategorisi
  stokta yeniden sitede gösterilince).
- **Kategoriler (2026-11-22, kullanıcının isteği):** sitenin kategori ağacı stok sisteminden gelir
  (`GET /api/v1/categories`; Selstok'ta tek ortak ağaç, kategori başına "sitede görünsün"
  anahtarı, Selstok panelinde Web sitesi entegrasyonu → Sitedeki kategoriler). Her eşitleme önce
  ağacı yazar (`kategorileriYaz`): `kategoriler.stok_kategori_id` ile eşler; ad, üst kategori, sıra
  (listedeki yer) ve yayın oradan; görsel, açıklama, adres, ana sayfa, SEO sitenin. Elle açılmış
  kategoriler silinir (ürünleri kategorisiz kalır); stoktan gelip listeden çıkan kategori pasife
  alınır, geri gelince aynı kayıt açılır. Bağlantı kuruluyken admin'de yeni kategori açılmaz,
  stoktan gelen kategori silinmez; ad/üst/sıra/yayın formda salt okunur (sunucu da yok sayar).
  Stoktan gelen ürünün kategori seçimi kilitli. Ağaç her derinlikte olabilir: "kategori ve
  altları" ve ürün sayımları özyinelemeli. Webhook `category.updated` → kategoriler + `since`
  ile ürünler (`esitle()`).
- Anlık güncelleme: `POST /api/stok/webhook` (imza `X-Stok-Signature: v1=HMAC(sır, "ts.gövde")`,
  5 dk pencere), ürünü kaynaktan yeniden okur. Güvenlik ağı: `GET /api/stok/esitle` her gece
  (`vercel.json` cron, `Bearer CRON_SECRET`) ve paneldeki "Şimdi eşitle". "Şimdi eşitle" yalnız
  son eşitlemeden beri stokta değişenleri çeker; sitede silinen bir ürün yalnız "Tümünü yeniden
  oku" ile geri gelir.
- Ortam değişkenleri (repo herkese açık — değerler yalnız `.env.local` ve Vercel'de):
  `STOK_API_URL` (Selstok paneli: `https://selstok.vercel.app`),
  `STOK_API_KEY` (Stok Yönetimi paneli → Web sitesi entegrasyonu → API anahtarı, firmanın sahibi
  oluşturur), `STOK_WEBHOOK_SECRET` (aynı ekranda webhook eklenince verilen sır; webhook adresi
  `https://<site>/api/stok/webhook`), `CRON_SECRET`.

## Anahtarlar: Doppler

Anahtarlar Doppler'da, proje **`boztepe-as`** (çalışma alanı overfitsoft): `dev` = bu bilgisayar,
`prd` = canlı. `doppler.yaml` repoyu `boztepe-as`/`dev`'e bağlar (`doppler setup` bir kez). `npm run dev`
= `doppler run -- next dev`; `npm run dev:local` düz `next dev` (`.env.local`'ı okur, yedek olarak
duruyor). Vercel'deki ortam değişkenleri ayrı: Doppler → Vercel entegrasyonu kurulana kadar canlıda
değişen anahtar Vercel'de de güncellenmeli.

## Kataloglar

`/kataloglar` (vitrin, menüde ve alt bilgide): markaların PDF katalogları ve online katalog
bağlantıları, `grup`'a göre başlıklar altında kartlar (bugünkü boztepeas.com'daki Ürünlerimiz →
Mobilya / Vestel sayfalarının yerine). Admin `/admin/kataloglar` (liste, yeni, düzenle; kapak
görseli `TekilGorsel`). Tablo `kataloglar` (`tur`: `pdf` | `baglanti`, `baglanti` = PDF'in ya da
sayfanın adresi, `dosya_kimligi` yüklenen PDF'in depo kimliği). PDF sunucu eyleminden geçmez
(eylemler 1 MB, Vercel ~4.5 MB sınırı): Cloudinary varsa tarayıcı `katalogPdfImzasi()` ile imza
alıp doğrudan `raw/upload` yapar (kimlik `raw:boztepe/kataloglar/…`); yoksa (geliştirme)
`POST /api/admin/katalog-pdf` dosyayı `public/yuklenenler/kataloglar/`'a yazar (gitignore'da).
Cloudinary ücretsiz pakette `raw` dosya başına 10 MB ve PDF teslimi hesap ayarlarında açık
olmalı (Settings → Security → "Allow delivery of PDF and ZIP files").

## Bekleyen işler

- [x] GitHub reposu açıldı ve `main` dalı push'landı (`origin` = `pers:Boztepe12/boztepe-as.git`,
      SSH alias `pers`). `gh` hâlâ giriş yapılmamış durumda; push SSH üzerinden çalışıyor.
- [ ] Kullanıcıdan alınacaklar: logo, marka rengi onayı, firma bilgileri, IBAN listesi,
      "Hakkımızda" metni, gerçek ürün fotoğrafları, admin e-postası, domain yönlendirme kararı
- [ ] Neon `DATABASE_URL` ve Cloudinary anahtarları — deploy anında lazım, geliştirme
      sırasında PGlite ile ilerleniyor
- [ ] Canlıda Stok Yönetimi bağlantısı: Boztepe firması için Stok Yönetimi panelinde API
      anahtarı + webhook (`/api/stok/webhook`) oluşturulup `STOK_*` değişkenleri Vercel'e girilecek
