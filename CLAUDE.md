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
- Türkçe içerik ve Türkçe arayüz esas. Arama Türkçe karakter duyarsız çalışmalı.
- Git: `main` dalı, remote `pers:Boztepe12/boztepe-as.git` (SSH alias `pers` = kişisel hesap).

## Durum

Vitrin ve yönetim paneli tamamlandı; `npm run build` hatasız çalışıyor. Nerede kalındığı,
ekran ekran ne yapıldığı ve bilinen tuzaklar `ILERLEME.md` içinde tutuluyor — yeni bir
oturum önce onu okumalı.

## Bekleyen işler

- [x] GitHub reposu açıldı ve `main` dalı push'landı (`origin` = `pers:Boztepe12/boztepe-as.git`,
      SSH alias `pers`). `gh` hâlâ giriş yapılmamış durumda; push SSH üzerinden çalışıyor.
- [ ] Kullanıcıdan alınacaklar: logo, marka rengi onayı, firma bilgileri, IBAN listesi,
      "Hakkımızda" metni, gerçek ürün fotoğrafları, admin e-postası, domain yönlendirme kararı
- [ ] Neon `DATABASE_URL` ve Cloudinary anahtarları — deploy anında lazım, geliştirme
      sırasında PGlite ile ilerleniyor
