import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { z } from "zod";
import { getCurrentPrincipal } from "@/lib/permissions/authorization";
import { getMyStatement, money } from "@/lib/portal/statement";

const schema = z.object({ start: z.iso.date().optional(), end: z.iso.date().optional(), type: z.uuid().optional(), category: z.uuid().optional() });

export async function GET(request: Request) {
  const principal = await getCurrentPrincipal();
  if (principal?.role !== "employee") return new Response("Unauthorized", { status: 401 });
  const url = new URL(request.url);
  const parsed = schema.safeParse(Object.fromEntries([...url.searchParams].filter(([, value]) => value)));
  if (!parsed.success) return new Response("Invalid statement filters", { status: 400 });
  const statement = await getMyStatement(parsed.data);
  if (!statement) return new Response("Statement unavailable", { status: 404 });

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(await readFile(join(process.cwd(), "public", "brand", "caap-logo.png")));
  const pages: { page: ReturnType<typeof pdf.addPage>; y: number }[] = [];
  const newPage = () => {
    const page = pdf.addPage([595.28, 841.89]);
    page.drawImage(logo, { x: 42, y: 760, width: 68, height: 50 });
    pages.push({ page, y: 790 });
    return pages.at(-1)!;
  };
  let current = newPage();
  const line = (text: string, size = 9, font = regular, x = 42) => {
    if (current.y < 55) current = newPage();
    current.page.drawText(text.slice(0, 110), { x, y: current.y, size, font, color: rgb(.1, .15, .22) });
    current.y -= size + 6;
  };
  line("CAAP BAMC - EMPLOYEE STATEMENT OF ACCOUNT", 16, bold, 120);
  line(`${statement.employee.full_name} | Employee No. ${statement.employee.employee_number}`, 11, bold, 120);
  line(`Period: ${statement.period.start ?? "All records"} to ${statement.period.end ?? "Present"}`, 9, regular, 120);
  line(`Generated: ${new Date(statement.generated_at).toLocaleString("en-PH")}`, 9, regular, 120);
  current.y -= 8;
  line(`TOTAL DEBIT: ${money(statement.totals.debit)}     TOTAL CREDIT: ${money(statement.totals.credit)}`, 10, bold);
  current.y -= 8;
  line("TRANSACTIONS", 11, bold);
  line("Date       Reference          Type                     Debit          Credit         Balance", 8, bold);
  for (const item of statement.transactions) line(`${item.date.padEnd(11)} ${(item.reference_number ?? "-").slice(0, 16).padEnd(18)} ${item.transaction_type.slice(0, 20).padEnd(24)} ${(item.direction === "debit" ? money(item.amount) : "-").padEnd(14)} ${(item.direction === "credit" ? money(item.amount) : "-").padEnd(14)} ${money(item.running_balance)}`, 7);
  current.y -= 8;
  line("ACTIVE LOANS AND PAYMENT SCHEDULES", 11, bold);
  for (const loan of statement.loans) { line(`${loan.type} ${loan.account_number ?? ""} | Principal ${money(loan.principal)} | ${loan.status}`, 9, bold); for (const schedule of loan.schedules) line(`  ${schedule.due_date}  ${money(schedule.total_due)}  ${schedule.status}`, 8); }
  current.y -= 8;
  line("REBATE HISTORY", 11, bold);
  for (const rebate of statement.rebates) line(`${rebate.date}  ${rebate.type}  ${money(rebate.amount)}  ${rebate.status}`, 8);
  current.y -= 8;
  line("AUTHORIZED ATTACHMENTS", 11, bold);
  for (const attachment of statement.attachments) line(`${attachment.date ?? "No date"}  ${attachment.filename}`, 8);
  pages.forEach(({ page }, index) => page.drawText(`Page ${index + 1} of ${pages.length}`, { x: 500, y: 25, size: 8, font: regular, color: rgb(.3, .3, .3) }));
  return new Response(new Uint8Array(await pdf.save()), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename=statement-${statement.employee.employee_number}.pdf`, "cache-control": "private, no-store" } });
}
