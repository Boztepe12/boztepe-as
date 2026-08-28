import Link from "next/link";

export default function BulunamadiSayfasi() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="rakam font-baslik text-7xl text-kiremit">404</p>
      <h1 className="mt-4 font-baslik text-3xl text-murekkep">Aradığınız sayfa bulunamadı</h1>
      <p className="mt-3 max-w-md leading-relaxed text-murekkep-yumusak">
        Bağlantı eskimiş ya da sayfa kaldırılmış olabilir. Ürünlerimize göz atabilir veya bize
        ulaşabilirsiniz.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-yumusak bg-kiremit px-5 font-medium text-white transition-colors hover:bg-kiremit-koyu"
        >
          Ana sayfaya dön
        </Link>
        <Link
          href="/urunler"
          className="inline-flex h-11 items-center rounded-yumusak border border-cizgi-koyu px-5 font-medium text-murekkep transition-colors hover:border-kiremit hover:text-kiremit"
        >
          Ürünleri incele
        </Link>
      </div>
    </div>
  );
}
