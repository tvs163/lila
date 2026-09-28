import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { PathLetter } from "@/lib/leela/letter";

const ink = rgb(0.11, 0.09, 0.16);
const mute = rgb(0.33, 0.29, 0.38);
const gold = rgb(0.62, 0.5, 0.28);
const paper = rgb(0.97, 0.95, 0.91);

function wrap(text: string, widthOf: (line: string) => number, max: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (line && widthOf(next) > max) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    if (!words.length) lines.push("");
  }
  return lines;
}

export async function downloadLetter(letter: PathLetter, nickname: string, intention: string) {
  const bytes = await fetch("/fonts/DejaVuSans.ttf").then((response) => {
    if (!response.ok) throw new Error("font");
    return response.arrayBuffer();
  });
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(bytes, { subset: true });
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 56;
  const max = pageWidth - margin * 2;
  let page = pdf.addPage([pageWidth, pageHeight]);
  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: paper });
  let y = pageHeight - margin;

  const ensure = (need: number) => {
    if (y - need > margin) return;
    page = pdf.addPage([pageWidth, pageHeight]);
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: paper });
    y = pageHeight - margin;
  };

  const write = (text: string, size: number, color: typeof ink, gap = 16) => {
    const lines = wrap(text, (line) => font.widthOfTextAtSize(line, size), max);
    for (const line of lines) {
      ensure(size + 6);
      page.drawText(line, { x: margin, y: y - size, size, font, color });
      y -= size + 5;
    }
    y -= gap;
  };

  write("LILA", 22, gold, 8);
  write(nickname ? `Письмо для ${nickname}` : "Письмо в конце пути", 16, ink, 6);
  write(`Вопрос, с которым ты вошёл: ${intention}`, 11, mute, 10);
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.6, color: gold });
  y -= 22;
  write("Какой ты в этом вопросе", 13, gold, 8);
  write(letter.fold, 11, ink, 14);
  write("На что опираться", 13, gold, 8);
  write(letter.strength, 11, ink, 14);
  write("Где себе мешаешь", 13, gold, 8);
  write(letter.shadow, 11, ink, 14);
  write("Чем пользоваться", 13, gold, 8);
  letter.tools.forEach((tool, index) => write(`${index + 1}. ${tool}`, 11, ink, 8));

  const file = await pdf.save();
  const copy = new Uint8Array(file.byteLength);
  copy.set(file);
  const blob = new Blob([copy.buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safe = nickname.replace(/[^\p{L}\p{N}\-]+/gu, "-").replace(/^-|-$/g, "").slice(0, 24);
  link.href = url;
  link.download = `LILA-${safe || "pismo"}.pdf`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
