import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import { loadReport } from "./data";
import { formatExactMoney } from "./format";
import type { ReportFilters, ReportPage, ReportRow } from "./types";
import { EXPORT_LIMITS } from "./validation";

const logoPath = () => join(process.cwd(), "public", "brand", "caap-logo.png");

async function collect(filters: ReportFilters, format: "xlsx" | "pdf") {
  const maximum = EXPORT_LIMITS[format];
  let current: ReportFilters = { ...filters, cursorKey: undefined, cursorId: undefined };
  let first: ReportPage | undefined;
  const rows: ReportRow[] = [];
  while (rows.length <= maximum) {
    const page = await loadReport(current);
    first ??= page;
    rows.push(...page.rows);
    if (!page.nextCursor) break;
    current = { ...current, cursorKey: page.nextCursor.key, cursorId: page.nextCursor.id };
  }
  if (rows.length > maximum) throw new RangeError(`This export exceeds ${maximum.toLocaleString()} rows. Narrow the filters and try again.`);
  return { ...first!, rows };
}

export async function buildXlsx(filters: ReportFilters) {
  const report = await collect(filters, "xlsx");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CAAP BAMC Financial Records";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Report", { views: [{ state: "frozen", ySplit: 5, showGridLines: false }] });
  const logoId = workbook.addImage({ filename: logoPath(), extension: "png" });
  sheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 72, height: 53 } });
  sheet.mergeCells(1, 2, 1, Math.max(report.columns.length, 2));
  const title = sheet.getCell(1, 2);
  title.value = `CAAP BAMC - ${report.title}`;
  title.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF164E8A" } };
  title.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 42;
  sheet.getCell(2, 2).value = `Generated: ${new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date())}`;
  sheet.getCell(3, 2).value = `Period: ${filters.start ?? "All records"} to ${filters.end ?? "Present"}`;
  sheet.addRow([]);
  const header = sheet.addRow(report.columns.map((column) => column.label));
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2767A5" } };
  for (const row of report.rows) sheet.addRow(report.columns.map((column) => column.kind === "money" ? String(row[column.key] ?? "0") : row[column.key] ?? ""));
  sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: Math.max(5, sheet.rowCount), column: Math.max(1, report.columns.length) } };
  report.columns.forEach((column, index) => {
    const target = sheet.getColumn(index + 1);
    target.width = Math.min(42, Math.max(12, column.label.length + 3, ...report.rows.slice(0, 200).map((row) => String(row[column.key] ?? "").length + 2)));
  });
  sheet.eachRow((row, index) => { if (index > 5 && index % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F6F9" } }; row.alignment = { vertical: "top", wrapText: true }; });
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

export async function buildPdf(filters: ReportFilters) {
  const report = await collect(filters, "pdf");
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(await readFile(logoPath()));
  const pages: PDFPage[] = [];
  let page: PDFPage;
  let y = 0;
  const newPage = () => {
    page = pdf.addPage([841.89, 595.28]); pages.push(page); y = 548;
    page.drawImage(logo, { x: 36, y: 510, width: 72, height: 53 });
    page.drawText(`CAAP BAMC - ${report.title}`, { x: 120, y, size: 15, font: bold, color: rgb(.08, .25, .45) });
    y -= 22;
    page.drawText(`Period: ${filters.start ?? "All records"} to ${filters.end ?? "Present"} | Generated in Asia/Manila`, { x: 120, y, size: 8, font: regular, color: rgb(.3, .35, .4) });
    y -= 24;
  };
  newPage();
  const widths = report.columns.map(() => Math.max(65, 760 / Math.max(1, report.columns.length)));
  const drawHeader = () => { let x = 36; for (let i = 0; i < report.columns.length; i++) { page.drawText(report.columns[i].label.slice(0, 18), { x, y, size: 7, font: bold, color: rgb(.08, .2, .35) }); x += widths[i]; } y -= 15; };
  drawHeader();
  for (const row of report.rows) {
    if (y < 45) { newPage(); drawHeader(); }
    let x = 36;
    for (let i = 0; i < report.columns.length; i++) { const column = report.columns[i]; const raw = column.kind === "money" ? formatExactMoney(String(row[column.key] ?? 0)) : String(row[column.key] ?? "-"); page.drawText(raw.slice(0, Math.max(8, Math.floor(widths[i] / 4.5))), { x, y, size: 6.5, font: regular, color: rgb(.12, .15, .2) }); x += widths[i]; }
    y -= 13;
  }
  pages.forEach((item, index) => item.drawText(`Page ${index + 1} of ${pages.length}`, { x: 760, y: 20, size: 7, font: regular, color: rgb(.35, .35, .35) }));
  return new Uint8Array(await pdf.save());
}

export function safeReportFilename(report: string, extension: string) { return `caap-bamc-${report.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.${extension}`; }
