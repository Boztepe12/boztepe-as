"use client";

import { useState } from "react";

import { WhatsappSimgesi } from "@/components/site/marka-simgeleri";
import { DisBaglanti } from "@/components/ui/buton";
import { Alan, Girdi, MetinKutusu } from "@/components/ui/form";
import { whatsappBaglantisi } from "@/lib/utils";

/**
 * Form, mesajı sunucuya göndermek yerine WhatsApp'a hazır metin olarak taşır.
 *
 * Mağazanın zaten kullandığı kanal WhatsApp; mesajı veritabanına yazmak ek bir
 * gelen kutusu yaratır ve kimsenin bakmadığı bir yere düşme riski doğurur. Bu
 * yöntem ayrıca e-posta servisi gerektirmediği için altyapıyı ücretsiz tutuyor.
 */
export function IletisimFormu({ whatsappNumarasi }: { whatsappNumarasi: string }) {
  const [ad, setAd] = useState("");
  const [konu, setKonu] = useState("");
  const [mesaj, setMesaj] = useState("");

  const hazirMesaj = [
    ad ? `Merhaba, ben ${ad}.` : "Merhaba,",
    konu ? `Konu: ${konu}` : "",
    mesaj,
  ]
    .filter(Boolean)
    .join("\n");

  const gonderilebilir = mesaj.trim().length > 0;

  return (
    <div className="rounded-panel border border-cizgi bg-yuzey p-6 shadow-kart">
      <h2 className="font-baslik text-2xl text-murekkep">Bize yazın</h2>
      <p className="mt-2 text-sm leading-relaxed text-murekkep-yumusak">
        Formu doldurun, mesajınız WhatsApp&apos;ta hazır şekilde açılsın. Böylece yazışma
        telefonunuzda kalır, takibi kolay olur.
      </p>

      <div className="mt-5 space-y-4">
        <Alan etiket="Adınız">
          <Girdi
            value={ad}
            onChange={(o) => setAd(o.target.value)}
            placeholder="Adınız ve soyadınız"
            autoComplete="name"
          />
        </Alan>

        <Alan etiket="Konu">
          <Girdi
            value={konu}
            onChange={(o) => setKonu(o.target.value)}
            placeholder="Örn. Buzdolabı fiyatı, montaj randevusu"
          />
        </Alan>

        <Alan etiket="Mesajınız" zorunlu>
          <MetinKutusu
            value={mesaj}
            onChange={(o) => setMesaj(o.target.value)}
            rows={5}
            placeholder="Nasıl yardımcı olabiliriz?"
          />
        </Alan>

        {gonderilebilir ? (
          <DisBaglanti
            href={whatsappBaglantisi(whatsappNumarasi, hazirMesaj)}
            gorunum="whatsapp"
            boyut="buyuk"
            tamGenislik
          >
            <WhatsappSimgesi className="size-5" />
            WhatsApp&apos;tan gönder
          </DisBaglanti>
        ) : (
          <button
            type="button"
            disabled
            className="flex h-13 w-full cursor-not-allowed items-center justify-center rounded-yumusak bg-solgun/30 px-7 font-medium text-murekkep-yumusak"
          >
            Mesajınızı yazın
          </button>
        )}
      </div>
    </div>
  );
}
