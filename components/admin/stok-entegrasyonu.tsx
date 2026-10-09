"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, RefreshCw } from "lucide-react";

import { TabloSarmali } from "@/components/admin/panel-parcalari";
import { Buton, ButonBaglanti } from "@/components/ui/buton";
import { Onay } from "@/components/ui/form";
import {
  stokBaglantisiniDene,
  stokEsitle,
  stokUrunleriniYayinla,
  urunStokAyari,
  yeniUrunAyari,
  type StokEylemSonucu,
} from "@/lib/eylemler/admin/stok";
import { fiyatBicimle } from "@/lib/utils";

/** Sunucu eylemini çalıştırıp sonucu bildirim olarak gösteren ortak yardımcı. */
function useEylem() {
  const router = useRouter();
  const [islemde, basla] = useTransition();
  const calistir = (is: () => Promise<StokEylemSonucu>, sonrasinda?: () => void) =>
    basla(async () => {
      try {
        const s = await is();
        if (s.durum === "hata") toast.error(s.mesaj);
        else {
          toast.success(s.mesaj);
          sonrasinda?.();
        }
        router.refresh();
      } catch {
        toast.error("İşlem tamamlanamadı. Oturumunuz sona ermiş olabilir, sayfayı yenileyin.");
      }
    });
  return { islemde, calistir };
}

export function StokDenetimi({ yeniUrunleriYayinla }: { yeniUrunleriYayinla: boolean }) {
  const { islemde, calistir } = useEylem();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Buton boyut="kucuk" disabled={islemde} onClick={() => calistir(() => stokEsitle(false))}>
          <RefreshCw className="size-4" /> {islemde ? "Eşitleniyor…" : "Şimdi eşitle"}
        </Buton>
        <Buton boyut="kucuk" gorunum="ikincil" disabled={islemde} onClick={() => calistir(stokBaglantisiniDene)}>
          Bağlantıyı dene
        </Buton>
        <Buton boyut="kucuk" gorunum="sessiz" disabled={islemde} onClick={() => {
          if (window.confirm("Bütün ürünler stok sisteminden baştan okunacak. Devam edilsin mi?")) calistir(() => stokEsitle(true));
        }}>
          Tümünü yeniden oku
        </Buton>
      </div>
      <Onay
        etiket={<>Stoktan yeni gelen ürünler hemen sitede yayınlansın<span className="block text-xs text-solgun">Kapalıyken yeni ürünler gizli gelir, siz seçip yayınlarsınız.</span></>}
        defaultChecked={yeniUrunleriYayinla}
        disabled={islemde}
        onChange={(e) => calistir(() => yeniUrunAyari(e.target.checked))}
      />
    </div>
  );
}

export type StokListeUrunu = {
  id: number;
  ad: string;
  slug: string;
  stokBarkod: string;
  stokMiktari: string | null;
  fiyat: string | null;
  stokListeFiyati: string | null;
  fiyatStoktan: boolean;
  aktif: boolean;
};

export function StokUrunListesi({ urunler, gorunum }: { urunler: StokListeUrunu[]; gorunum: "bekleyen" | "yayinda" }) {
  const { islemde, calistir } = useEylem();
  const [secili, setSecili] = useState<number[]>([]);
  const yayinla = gorunum === "bekleyen";
  const sec = (id: number) => setSecili((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const hepsi = urunler.length > 0 && secili.length === urunler.length;

  const sekmeler = (
    <div className="flex gap-4 border-b border-cizgi px-5 py-3 text-sm">
      <Link href="/admin/stok" className={yayinla ? "font-semibold text-kiremit" : "text-murekkep-yumusak"}>Yayın bekleyen</Link>
      <Link href="/admin/stok?gorunum=yayinda" className={!yayinla ? "font-semibold text-kiremit" : "text-murekkep-yumusak"}>Yayında</Link>
    </div>
  );

  if (urunler.length === 0) {
    return (
      <>
        {sekmeler}
        <p className="p-5 text-sm text-murekkep-yumusak">
          {yayinla ? "Yayın bekleyen ürün yok." : "Stok sisteminden gelip yayında olan ürün yok."}
        </p>
      </>
    );
  }

  const fiyatMetni = (u: StokListeUrunu) => (u.fiyat ? fiyatBicimle(u.fiyat, true) : "Fiyat yok");

  return (
    <>
      {sekmeler}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-kiremit" checked={hepsi}
            onChange={() => setSecili(hepsi ? [] : urunler.map((u) => u.id))} />
          Tümünü seç
        </label>
        {secili.length > 0 && (
          <Buton boyut="kucuk" gorunum={yayinla ? "birincil" : "ikincil"} disabled={islemde}
            onClick={() => calistir(() => stokUrunleriniYayinla(secili, yayinla), () => setSecili([]))}>
            {yayinla ? `${secili.length} ürünü yayınla` : `${secili.length} ürünü gizle`}
          </Buton>
        )}
      </div>

      {/* Telefon: kart */}
      <ul className="divide-y divide-cizgi md:hidden">
        {urunler.map((u) => (
          <li key={u.id} className="flex items-start gap-3 px-5 py-3">
            <input type="checkbox" className="mt-1 size-5 accent-kiremit" checked={secili.includes(u.id)} onChange={() => sec(u.id)} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-murekkep">{u.ad}</p>
              <p className="text-xs text-solgun">{u.stokBarkod} · stok {Number(u.stokMiktari ?? 0).toLocaleString("tr-TR")}</p>
              <p className="rakam mt-1 text-sm">{fiyatMetni(u)}{!u.fiyatStoktan && <span className="text-xs text-solgun"> (elle)</span>}</p>
            </div>
            <ButonBaglanti href={`/admin/urunler/${u.id}`} boyut="kucuk" gorunum="sessiz" aria-label="Düzenle"><Pencil className="size-4" /></ButonBaglanti>
          </li>
        ))}
      </ul>

      {/* Tablet ve üstü: tablo */}
      <div className="hidden md:block">
        <TabloSarmali>
            <thead className="text-left text-xs text-murekkep-yumusak">
              <tr className="border-b border-cizgi">
                <th className="w-10 px-5 py-2" />
                <th className="py-2">Ürün</th>
                <th className="py-2">Barkod</th>
                <th className="py-2 text-right">Stok</th>
                <th className="py-2 text-right">Fiyat</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cizgi">
              {urunler.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-2.5">
                    <input type="checkbox" className="size-4 accent-kiremit" checked={secili.includes(u.id)} onChange={() => sec(u.id)} />
                  </td>
                  <td className="py-2.5 font-medium text-murekkep">{u.ad}</td>
                  <td className="py-2.5 font-mono text-xs text-solgun">{u.stokBarkod}</td>
                  <td className="rakam py-2.5 text-right">{Number(u.stokMiktari ?? 0).toLocaleString("tr-TR")}</td>
                  <td className="rakam py-2.5 text-right">
                    {fiyatMetni(u)}
                    {!u.fiyatStoktan && <span className="block text-xs text-solgun">elle · stokta {u.stokListeFiyati ? fiyatBicimle(u.stokListeFiyati, true) : "yok"}</span>}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <ButonBaglanti href={`/admin/urunler/${u.id}`} boyut="kucuk" gorunum="sessiz">Düzenle</ButonBaglanti>
                  </td>
                </tr>
              ))}
            </tbody>
        </TabloSarmali>
      </div>
    </>
  );
}

/** Ürün düzenleme sayfasındaki "Stok sisteminden" kutusunun anahtarları. */
export function UrunStokAyari({ id, fiyatStoktan, stokDurumuStoktan }: { id: number; fiyatStoktan: boolean; stokDurumuStoktan: boolean }) {
  const { islemde, calistir } = useEylem();
  const [fiyat, setFiyat] = useState(fiyatStoktan);
  const [durum, setDurum] = useState(stokDurumuStoktan);
  const kaydet = (f: boolean, d: boolean) => {
    setFiyat(f);
    setDurum(d);
    calistir(() => urunStokAyari(id, { fiyatStoktan: f, stokDurumuStoktan: d }));
  };
  return (
    <div className="space-y-2">
      <Onay
        etiket={<>Fiyat stok sisteminden gelsin<span className="block text-xs text-solgun">Kapatırsanız aşağıdaki formda girdiğiniz fiyat kalır; stoktaki fiyat değişse de değişmez.</span></>}
        checked={fiyat} disabled={islemde} onChange={(e) => kaydet(e.target.checked, durum)}
      />
      <Onay
        etiket={<>Stok durumu stok miktarından gelsin<span className="block text-xs text-solgun">Stokta varsa &quot;Stokta&quot;, yoksa &quot;Tükendi&quot;. &quot;Siparişe bağlı&quot; seçtiğiniz ürünlere dokunulmaz.</span></>}
        checked={durum} disabled={islemde} onChange={(e) => kaydet(fiyat, e.target.checked)}
      />
    </div>
  );
}
