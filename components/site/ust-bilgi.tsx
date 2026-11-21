"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Phone, Search, ShoppingBag, X } from "lucide-react";

import { useSepet } from "@/components/sepet/sepet-durumu";
import { WhatsappSimgesi } from "@/components/site/marka-simgeleri";
import type { KategoriDugumu } from "@/lib/sorgular/kategoriler";
import type { IletisimAyari } from "@/lib/sorgular/icerik";
import { cn, telefonBicimle, whatsappBaglantisi } from "@/lib/utils";
import { MarkaLogosu } from "@/components/site/marka-logosu";

const SABIT_BAGLANTILAR = [
  { ad: "Tüm Ürünler", yol: "/urunler" },
  { ad: "Kampanyalar", yol: "/kampanyalar" },
  { ad: "Kataloglar", yol: "/kataloglar" },
  { ad: "Hakkımızda", yol: "/hakkimizda" },
  { ad: "Galeri", yol: "/galeri" },
  { ad: "İletişim", yol: "/iletisim" },
];

export function UstBilgi({
  kategoriler,
  iletisim,
}: {
  kategoriler: KategoriDugumu[];
  iletisim: IletisimAyari;
}) {
  const yol = usePathname();
  const router = useRouter();
  const { toplamAdet, hazir } = useSepet();

  const [mobilAcik, setMobilAcik] = useState(false);
  const [acikKategori, setAcikKategori] = useState<number | null>(null);
  const [urunMenusu, setUrunMenusu] = useState(false);
  const kapatmaZamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fareylaAcildi = useRef(0);
  const [aramaAcik, setAramaAcik] = useState(false);
  const [aramaTerimi, setAramaTerimi] = useState("");
  const aramaGirdisi = useRef<HTMLInputElement>(null);

  /*
   * Sayfa değişince açık kalan menüler kapanmalı. Bunu efekt içinde yapmak menünün
   * bir kare boyunca açık görünmesine ve fazladan bir render'a yol açıyor; React'in
   * önerdiği yol, değişikliği render sırasında fark edip durumu hemen düzeltmek.
   */
  const [oncekiYol, setOncekiYol] = useState(yol);
  if (yol !== oncekiYol) {
    setOncekiYol(yol);
    setMobilAcik(false);
    setAcikKategori(null);
    setAramaAcik(false);
    setUrunMenusu(false);
  }

  /* Ürünler menüsü: fareyle girip çıkarken kısa bir gecikmeyle kapanır (paneline geçerken kapanmasın). */
  function menuyuAc() {
    if (kapatmaZamanlayici.current) clearTimeout(kapatmaZamanlayici.current);
    if (!urunMenusu) fareylaAcildi.current = Date.now();
    setUrunMenusu(true);
  }
  /* Tıklama: fare az önce açtıysa açık kalsın (yoksa üzerine gelip tıklayan kapatmış olur); dokunmatikte aç/kapa. */
  function menuyeTikla() {
    if (urunMenusu && Date.now() - fareylaAcildi.current < 500) return;
    setUrunMenusu((a) => !a);
  }
  function menuyuKapat() {
    if (kapatmaZamanlayici.current) clearTimeout(kapatmaZamanlayici.current);
    kapatmaZamanlayici.current = setTimeout(() => setUrunMenusu(false), 150);
  }

  /* Mobil menü açıkken arka planın kaymasını engelle. */
  useEffect(() => {
    document.body.style.overflow = mobilAcik ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobilAcik]);

  useEffect(() => {
    if (aramaAcik) aramaGirdisi.current?.focus();
  }, [aramaAcik]);

  /* Esc ürünler menüsünü kapatır. */
  useEffect(() => {
    if (!urunMenusu) return;
    const tus = (o: KeyboardEvent) => o.key === "Escape" && setUrunMenusu(false);
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [urunMenusu]);

  function aramaGonder(olay: React.FormEvent) {
    olay.preventDefault();
    const terim = aramaTerimi.trim();
    if (!terim) return;
    router.push(`/urunler?arama=${encodeURIComponent(terim)}`);
    setAramaAcik(false);
    setMobilAcik(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-cizgi bg-kum/95 backdrop-blur-sm">
      {/* Üst şerit — iletişim bilgileri, yalnızca geniş ekranda */}
      <div className="hidden border-b border-cizgi/70 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs text-murekkep-yumusak">
          <p>1963&apos;ten beri Malatya&apos;da — {iletisim.firmaAdi}</p>
          <div className="flex items-center gap-5">
            {iletisim.calismaSaatleri[0] && (
              <span>
                {iletisim.calismaSaatleri[0].gun}: {iletisim.calismaSaatleri[0].saat}
              </span>
            )}
            <a
              href={`tel:${iletisim.telefon.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 font-medium text-murekkep hover:text-kiremit"
            >
              <Phone className="size-3.5" />
              {iletisim.telefon}
            </a>
          </div>
        </div>
      </div>

      {/* Ana çubuk */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={() => setMobilAcik(true)}
          className="-ml-1 rounded-yumusak p-2 text-murekkep hover:bg-kum-koyu lg:hidden"
          aria-label="Menüyü aç"
        >
          <Menu className="size-5" />
        </button>

        <Link href="/" className="shrink-0" aria-label="Boztepe A.Ş. ana sayfa">
          <MarkaLogosu oncelikli className="h-9 sm:h-11" />
        </Link>

        {/* Masaüstü gezinme: kategoriler tek "Ürünler" menüsünde, kaç tane olursa olsun bar sıkışmaz. */}
        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          <div onMouseEnter={menuyuAc} onMouseLeave={menuyuKapat}>
            <button
              type="button"
              onClick={menuyeTikla}
              aria-expanded={urunMenusu}
              aria-controls="urun-menusu"
              className={cn(
                "flex items-center gap-1 rounded-yumusak px-3 py-2 text-[0.9375rem] font-medium transition-colors",
                urunMenusu || yol.startsWith("/kategori/") || yol.startsWith("/urun")
                  ? "text-kiremit"
                  : "text-murekkep hover:text-kiremit",
              )}
            >
              Ürünler
              <ChevronDown className={cn("size-4 transition-transform", urunMenusu && "rotate-180")} />
            </button>
          </div>

          {SABIT_BAGLANTILAR.slice(1).map((baglanti) => (
            <Link
              key={baglanti.yol}
              href={baglanti.yol}
              className={cn(
                "rounded-yumusak px-3 py-2 text-[0.9375rem] font-medium transition-colors",
                yol === baglanti.yol ? "text-kiremit" : "text-murekkep hover:text-kiremit",
              )}
            >
              {baglanti.ad}
            </Link>
          ))}
        </nav>

        {/* Sağ eylemler */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAramaAcik((a) => !a)}
            className="rounded-yumusak p-2.5 text-murekkep hover:bg-kum-koyu"
            aria-label="Ürün ara"
            aria-expanded={aramaAcik}
          >
            <Search className="size-5" />
          </button>

          <a
            href={whatsappBaglantisi(iletisim.whatsapp, "Merhaba, bilgi almak istiyorum.")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-yumusak p-2.5 text-murekkep hover:bg-kum-koyu sm:block"
            aria-label="WhatsApp ile yazın"
          >
            <WhatsappSimgesi className="size-5" />
          </a>

          <Link
            href="/teklif-sepeti"
            className="relative rounded-yumusak p-2.5 text-murekkep hover:bg-kum-koyu"
            aria-label="Teklif sepeti"
          >
            <ShoppingBag className="size-5" />
            {hazir && toplamAdet > 0 && (
              <span className="rakam absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-kiremit text-[0.6875rem] font-semibold text-white">
                {toplamAdet > 99 ? "99+" : toplamAdet}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Ürünler menüsü (masaüstü): her ana kategori bir sütun, altında alt kategorileri. */}
      {urunMenusu && (
        <div
          id="urun-menusu"
          onMouseEnter={menuyuAc}
          onMouseLeave={menuyuKapat}
          className="absolute inset-x-0 top-full hidden border-b border-cizgi bg-yuzey shadow-panel lg:block"
        >
          <div className="mx-auto max-w-7xl px-6 py-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-solgun">Kategoriler</p>
              <Link href="/urunler" className="text-sm font-medium text-kiremit hover:underline">
                Tüm ürünleri gör →
              </Link>
            </div>
            {kategoriler.length === 0 ? (
              <p className="text-sm text-murekkep-yumusak">Henüz kategori yok.</p>
            ) : (
              <div className="grid max-h-[65vh] grid-cols-4 gap-x-8 gap-y-6 overflow-y-auto">
                {kategoriler.map((kategori) => (
                  <div key={kategori.id} className="min-w-0">
                    <Link
                      href={`/kategori/${kategori.slug}`}
                      className="flex items-baseline justify-between gap-2 font-govde font-semibold text-murekkep hover:text-kiremit"
                    >
                      <span className="truncate">{kategori.ad}</span>
                      <span className="rakam shrink-0 text-xs font-normal text-solgun">{kategori.urunAdedi}</span>
                    </Link>
                    {kategori.altKategoriler.length > 0 && (
                      <ul className="mt-2 space-y-1 border-l border-cizgi pl-3">
                        {kategori.altKategoriler.map((alt) => (
                          <li key={alt.id}>
                            <Link
                              href={`/kategori/${alt.slug}`}
                              className="flex items-baseline justify-between gap-2 py-0.5 text-sm text-murekkep-yumusak hover:text-kiremit"
                            >
                              <span className="truncate">{alt.ad}</span>
                              <span className="rakam shrink-0 text-xs text-solgun">{alt.urunAdedi}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Açılır arama alanı */}
      {aramaAcik && (
        <div className="border-t border-cizgi bg-yuzey">
          <form onSubmit={aramaGonder} className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-solgun" />
              <input
                ref={aramaGirdisi}
                type="search"
                value={aramaTerimi}
                onChange={(o) => setAramaTerimi(o.target.value)}
                placeholder="Ürün, marka veya kategori arayın…"
                className="h-12 w-full rounded-yumusak border border-cizgi-koyu bg-kum pl-11 pr-4 text-murekkep placeholder:text-solgun focus:border-kiremit focus:outline-none focus:ring-2 focus:ring-kiremit/20"
              />
            </div>
          </form>
        </div>
      )}

      {/* Mobil çekmece */}
      {mobilAcik && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-murekkep/40"
            onClick={() => setMobilAcik(false)}
            aria-label="Menüyü kapat"
          />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-kum shadow-panel">
            <div className="flex items-center justify-between border-b border-cizgi px-5 py-4">
              <MarkaLogosu className="h-9" />
              <button
                type="button"
                onClick={() => setMobilAcik(false)}
                className="rounded-yumusak p-2 text-murekkep hover:bg-kum-koyu"
                aria-label="Menüyü kapat"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.16em] text-solgun">Ürünler</p>
              <Link
                href="/urunler"
                className="block rounded-yumusak px-3 py-2.5 font-medium text-kiremit hover:bg-kum-koyu"
              >
                Tüm ürünler
              </Link>
              {kategoriler.map((kategori) => (
                <div key={kategori.id} className="mb-1">
                  <div className="flex items-center">
                    <Link
                      href={`/kategori/${kategori.slug}`}
                      className="flex-1 rounded-yumusak px-3 py-2.5 font-medium text-murekkep hover:bg-kum-koyu"
                    >
                      {kategori.ad}
                    </Link>
                    {kategori.altKategoriler.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setAcikKategori((a) => (a === kategori.id ? null : kategori.id))
                        }
                        className="rounded-yumusak p-2.5 text-solgun hover:bg-kum-koyu"
                        aria-label={`${kategori.ad} alt kategorileri`}
                        aria-expanded={acikKategori === kategori.id}
                      >
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform",
                            acikKategori === kategori.id && "rotate-180",
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {acikKategori === kategori.id && (
                    <div className="ml-3 border-l border-cizgi pl-3">
                      {kategori.altKategoriler.map((alt) => (
                        <Link
                          key={alt.id}
                          href={`/kategori/${alt.slug}`}
                          className="flex items-center justify-between rounded-yumusak px-3 py-2 text-sm text-murekkep-yumusak hover:bg-kum-koyu hover:text-murekkep"
                        >
                          {alt.ad}
                          <span className="rakam text-xs text-solgun">{alt.urunAdedi}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="my-3 border-t border-cizgi" />

              {SABIT_BAGLANTILAR.slice(1).map((baglanti) => (
                <Link
                  key={baglanti.yol}
                  href={baglanti.yol}
                  className="block rounded-yumusak px-3 py-2.5 font-medium text-murekkep hover:bg-kum-koyu"
                >
                  {baglanti.ad}
                </Link>
              ))}
            </nav>

            <div className="border-t border-cizgi p-4">
              <a
                href={`tel:${iletisim.telefon.replace(/\s/g, "")}`}
                className="flex items-center gap-2 rounded-yumusak px-3 py-2 text-sm font-medium text-murekkep hover:bg-kum-koyu"
              >
                <Phone className="size-4 text-kiremit" />
                {iletisim.telefon}
              </a>
              <a
                href={whatsappBaglantisi(iletisim.whatsapp, "Merhaba, bilgi almak istiyorum.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-yumusak px-3 py-2 text-sm font-medium text-murekkep hover:bg-kum-koyu"
              >
                <WhatsappSimgesi className="size-4 text-[#25D366]" />
                {telefonBicimle(iletisim.whatsapp)}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
