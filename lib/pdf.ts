import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!words.length) return ["—"];
  const lines: string[] = [];
  let line = words[0];
  for (const word of words.slice(1)) {
    const candidate = `${line} ${word}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
    else { lines.push(line); line = word; }
  }
  lines.push(line);
  return lines;
}

export type VisitPdfData = {
  workOrderNumber: string;
  visitSequence: number;
  typeLabel: string;
  clientName: string;
  locationName: string;
  address: string;
  technicianName: string;
  startedAt: string;
  endedAt: string;
  outcomeLabel: string;
  signerName: string;
  generalNotes: string;
  reports: Array<{
    machineLabel: string;
    problemFound: string;
    workPerformed: string;
    actionsTaken: string;
    partsReplaced: string;
    observations: string;
  }>;
};

export async function createVisitPdf(data: VisitPdfData, signature: Uint8Array) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const signatureImage = await pdf.embedPng(signature);
  const blue = rgb(0.06, 0.22, 0.31);
  const accent = rgb(0.09, 0.51, 0.66);
  const grey = rgb(0.35, 0.42, 0.47);
  const margin = 42;
  const width = 595;
  let page = pdf.addPage([width, 842]);
  let y = 800;

  const newPage = () => {
    page = pdf.addPage([width, 842]);
    y = 800;
    page.drawRectangle({ x: 0, y: 814, width, height: 28, color: blue });
    page.drawText("CLIMACONTROL · PARTE DE TRABAJO", { x: margin, y: 824, size: 10, font: bold, color: rgb(1, 1, 1) });
  };
  const ensureSpace = (height: number) => { if (y - height < 55) newPage(); };
  const heading = (title: string) => {
    ensureSpace(32);
    page.drawText(title.toUpperCase(), { x: margin, y, size: 9, font: bold, color: accent });
    y -= 18;
  };
  const row = (label: string, value: string) => {
    const lines = wrapText(value || "—", regular, 9.5, 390);
    ensureSpace(Math.max(20, lines.length * 12 + 6));
    page.drawText(label, { x: margin, y, size: 9, font: bold, color: grey });
    lines.forEach((line, index) => page.drawText(line, { x: 155, y: y - index * 12, size: 9.5, font: regular, color: blue }));
    y -= Math.max(20, lines.length * 12 + 6);
  };

  newPage();
  page.drawText(data.workOrderNumber, { x: margin, y, size: 21, font: bold, color: blue });
  page.drawText(`Visita ${data.visitSequence}`, { x: 455, y: y + 3, size: 10, font: bold, color: accent });
  y -= 32;
  row("Cliente", data.clientName);
  row("Local", `${data.locationName} · ${data.address}`);
  row("Tipo", data.typeLabel);
  row("Técnico", data.technicianName);
  row("Horario", `${data.startedAt} — ${data.endedAt}`);
  row("Resultado", data.outcomeLabel);

  data.reports.forEach((report, index) => {
    ensureSpace(145);
    y -= 6;
    page.drawRectangle({ x: margin, y: y - 2, width: width - margin * 2, height: 22, color: rgb(0.93, 0.97, 0.98) });
    page.drawText(`${index + 1}. ${report.machineLabel}`, { x: margin + 8, y: y + 5, size: 10, font: bold, color: blue });
    y -= 28;
    row("Problema", report.problemFound);
    row("Trabajo", report.workPerformed);
    row("Acciones", report.actionsTaken);
    row("Piezas", report.partsReplaced);
    row("Observaciones", report.observations);
  });

  heading("Cierre de la visita");
  row("Observaciones generales", data.generalNotes);
  ensureSpace(105);
  page.drawText("Firma del cliente", { x: margin, y, size: 9, font: bold, color: grey });
  const dimensions = signatureImage.scaleToFit(180, 70);
  page.drawImage(signatureImage, { x: 155, y: y - dimensions.height + 10, width: dimensions.width, height: dimensions.height });
  page.drawText(data.signerName, { x: 155, y: y - dimensions.height - 4, size: 9.5, font: regular, color: blue });

  return pdf.save();
}
