import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

/**
 * Bu projedeki Claude Code sohbet gecmisini okunabilir bir dosyaya cikarir.
 *
 * Claude Code her sohbeti `~/.claude/projects/<kodlanmis-yol>/<oturum-id>.jsonl`
 * altinda satir satir JSON olarak tutar. Bu bicim makine icin uygun ama insan
 * okumasi zor; burada onu Markdown'a ceviriyoruz. Ham .jsonl de yanina
 * kopyalaniyor, boylece gerekirse `claude --resume` ile tam olarak geri yuklenebilir.
 *
 * Kullanim:  node scripts/sohbet-disari-aktar.mjs
 */

const PROJE_KOKU = process.cwd();
const CIKTI_KLASORU = path.join(PROJE_KOKU, "sohbet-gecmisi");

/* Claude Code klasor adini yoldaki `:` ve ayiraclari `-` yaparak uretir. */
function kodlanmisYol(yol) {
  return yol.replace(/:/g, "-").replace(/[\\/]/g, "-");
}

function gecmisKlasoruBul() {
  const kok = path.join(homedir(), ".claude", "projects");
  const beklenen = kodlanmisYol(PROJE_KOKU);

  if (existsSync(path.join(kok, beklenen))) return path.join(kok, beklenen);

  /* Surucu harfinin buyuk/kucuk yazimi degisebiliyor; harf duyarsiz da arayalim. */
  const adaylar = readdirSync(kok).filter(
    (ad) => ad.toLowerCase() === beklenen.toLowerCase(),
  );
  return adaylar.length > 0 ? path.join(kok, adaylar[0]) : null;
}

function metinCikar(icerik) {
  if (typeof icerik === "string") return icerik;
  if (!Array.isArray(icerik)) return "";

  const parcalar = [];
  for (const blok of icerik) {
    if (blok?.type === "text" && blok.text?.trim()) {
      parcalar.push(blok.text.trim());
    } else if (blok?.type === "tool_use") {
      const girdi = blok.input ?? {};
      const ozet =
        girdi.description ||
        girdi.file_path ||
        girdi.command ||
        girdi.pattern ||
        girdi.prompt ||
        "";
      const kisa = String(ozet).replace(/\s+/g, " ").slice(0, 110);
      parcalar.push(`> 🔧 **${blok.name}**${kisa ? ` — ${kisa}` : ""}`);
    }
    /* tool_result bloklari cok uzun ve cogu zaman gurultu; disarida birakiyoruz. */
  }
  return parcalar.join("\n\n");
}

function zamanBicimle(damga) {
  if (!damga) return "";
  const t = new Date(damga);
  if (Number.isNaN(t.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(t);
}

function calistir() {
  const klasor = gecmisKlasoruBul();
  if (!klasor) {
    console.error("Bu proje icin sohbet gecmisi klasoru bulunamadi.");
    console.error("Beklenen:", path.join(homedir(), ".claude", "projects", kodlanmisYol(PROJE_KOKU)));
    process.exit(1);
  }

  const dosyalar = readdirSync(klasor)
    .filter((ad) => ad.endsWith(".jsonl"))
    .map((ad) => ({ ad, yol: path.join(klasor, ad), zaman: statSync(path.join(klasor, ad)).mtimeMs }))
    .sort((a, b) => b.zaman - a.zaman);

  if (dosyalar.length === 0) {
    console.error("Klasorde .jsonl sohbet dosyasi yok:", klasor);
    process.exit(1);
  }

  mkdirSync(CIKTI_KLASORU, { recursive: true });

  for (const dosya of dosyalar) {
    const satirlar = readFileSync(dosya.yol, "utf8").split("\n").filter(Boolean);
    const bolumler = [];
    let ilkZaman = "";
    let sonZaman = "";

    for (const satir of satirlar) {
      let kayit;
      try {
        kayit = JSON.parse(satir);
      } catch {
        continue;
      }

      const rol = kayit?.message?.role;
      if (rol !== "user" && rol !== "assistant") continue;

      const metin = metinCikar(kayit.message.content);
      if (!metin.trim()) continue;

      /* Arac sonuclari `user` rolunde geri doner; gercek kullanici mesaji degiller. */
      const aracYaniti =
        Array.isArray(kayit.message.content) &&
        kayit.message.content.every((b) => b?.type === "tool_result");
      if (aracYaniti) continue;

      const zaman = zamanBicimle(kayit.timestamp);
      if (zaman) {
        if (!ilkZaman) ilkZaman = zaman;
        sonZaman = zaman;
      }

      const baslik = rol === "user" ? "### 👤 Kullanıcı" : "### 🤖 Claude";
      bolumler.push(`${baslik}${zaman ? `  \n<sub>${zaman}</sub>` : ""}\n\n${metin}`);
    }

    const oturumId = dosya.ad.replace(/\.jsonl$/, "");
    const basliklar = [
      `# Sohbet Geçmişi — Boztepe A.Ş.`,
      "",
      `**Oturum:** \`${oturumId}\``,
      ilkZaman ? `**Başlangıç:** ${ilkZaman}` : "",
      sonZaman ? `**Son mesaj:** ${sonZaman}` : "",
      `**Mesaj sayısı:** ${bolumler.length}`,
      "",
      "> Bu dosya `node scripts/sohbet-disari-aktar.mjs` ile üretildi.",
      "> Sohbeti gerçekten kaldığı yerden sürdürmek için bu klasörde `claude --continue` çalıştırın.",
      "",
      "---",
      "",
    ]
      .filter((s) => s !== "")
      .join("\n");

    const ciktiMd = path.join(CIKTI_KLASORU, `${oturumId}.md`);
    writeFileSync(ciktiMd, `${basliklar}\n${bolumler.join("\n\n---\n\n")}\n`, "utf8");

    /* Ham dosyayi da sakla: Markdown okumak icin, .jsonl geri yukleme icin. */
    const ciktiHam = path.join(CIKTI_KLASORU, `${oturumId}.jsonl`);
    writeFileSync(ciktiHam, readFileSync(dosya.yol));

    const boyutKb = Math.round(statSync(ciktiMd).size / 1024);
    console.log(`✓ ${oturumId}  →  ${bolumler.length} mesaj, ${boyutKb} KB`);
  }

  console.log(`\nKlasör: ${CIKTI_KLASORU}`);
}

calistir();
