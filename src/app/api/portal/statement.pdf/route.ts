import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

import { getCurrentPrincipal } from "@/lib/permissions/authorization";
import {
  getMyStatement,
  type EmployeeStatement,
} from "@/lib/portal/statement";
import { formatExactPeso } from "@/lib/portal/statement-format";
import { statementFilterSchema } from "@/validation/statement";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function safeFilenamePart(value: string) {
  return (
    value
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "employee"
  );
}
function pdfMoney(value: string | number | null | undefined) {
  return formatExactPeso(value).replace("₱", "PHP ");
}
function pdfSafeText(value: string) {
  return value.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "-");
}
function displayDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeZone: "Asia/Manila",
      }).format(new Date(`${value}T00:00:00+08:00`))
    : "-";
}
function periodLabel(statement: EmployeeStatement) {
  const { start, end } = statement.period;
  if (!start && !end) return "All Transactions";
  if (start && end) return `${displayDate(start)} to ${displayDate(end)}`;
  return start ? `From ${displayDate(start)}` : `Through ${displayDate(end)}`;
}

export async function GET(request: Request) {
  const principal = await getCurrentPrincipal();
  if (principal?.role !== "employee")
    return new Response("Unauthorized", { status: 401 });
  const url = new URL(request.url);
  const parsed = statementFilterSchema.safeParse({
    start: url.searchParams.get("start") || undefined,
    end: url.searchParams.get("end") || undefined,
    category: url.searchParams.get("category") || undefined,
  });
  if (!parsed.success)
    return new Response("Invalid statement filters", { status: 400 });
  const statement = await getMyStatement(parsed.data);
  if (!statement) return new Response("Statement unavailable", { status: 404 });

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(
    await readFile(join(process.cwd(), "public", "brand", "caap-logo.png")),
  );
  const pages: PDFPage[] = [];
  let page = addPage();
  let y = PAGE_HEIGHT - MARGIN;

  function addPage() {
    const next = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(next);
    return next;
  }
  function ensureSpace(height: number) {
    if (y - height < MARGIN + 18) {
      page = addPage();
      y = PAGE_HEIGHT - MARGIN;
    }
  }
  function line(
    text: string,
    options: {
      size?: number;
      font?: PDFFont;
      x?: number;
      color?: ReturnType<typeof rgb>;
      gap?: number;
    } = {},
  ) {
    const size = options.size ?? 8.5;
    ensureSpace(size + (options.gap ?? 5));
    page.drawText(pdfSafeText(text).slice(0, 135), {
      x: options.x ?? MARGIN,
      y,
      size,
      font: options.font ?? regular,
      color: options.color ?? rgb(0.08, 0.11, 0.16),
    });
    y -= size + (options.gap ?? 5);
  }
  function section(title: string) {
    ensureSpace(32);
    y -= 6;
    page.drawRectangle({
      x: MARGIN,
      y: y - 3,
      width: CONTENT_WIDTH,
      height: 18,
      color: rgb(0.92, 0.94, 0.97),
      borderColor: rgb(0.35, 0.4, 0.48),
      borderWidth: 0.5,
    });
    line(title.toUpperCase(), { size: 9, font: bold, x: MARGIN + 6, gap: 8 });
  }
  function tableHeader(columns: string[]) {
    ensureSpace(20);
    line(columns.join(" | "), { size: 7.2, font: bold, gap: 5 });
  }
  function row(values: string[]) {
    line(values.map((value) => value.replaceAll("|", "/")).join(" | "), {
      size: 7.1,
      gap: 4,
    });
  }

  page.drawImage(logo, { x: MARGIN, y: y - 48, width: 68, height: 50 });
  line("CIVIL AVIATION AUTHORITY OF THE PHILIPPINES", {
    size: 9,
    font: bold,
    x: 120,
  });
  line("Bacolod-Silay Airport - BAMC", { size: 9, font: bold, x: 120 });
  line("STATEMENT OF ACCOUNT", { size: 16, font: bold, x: 120, gap: 7 });
  line(`Period: ${periodLabel(statement)}`, { x: 120 });
  line(
    `Generated: ${new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(statement.generated_at))}`,
    { x: 120 },
  );
  y -= 14;

  section("Employee information");
  row([
    `Name: ${statement.employee.full_name}`,
    `Employee no.: ${statement.employee.employee_number}`,
  ]);
  row([
    `Department: ${statement.employee.department ?? "Not specified"}`,
    `Position: ${statement.employee.position_title ?? "Not specified"}`,
  ]);

  section("Account summary");
  tableHeader([
    "Current balance",
    "Selected debits",
    "Selected credits",
    "Outstanding loans",
  ]);
  row([
    pdfMoney(statement.summary.current_balance),
    pdfMoney(statement.summary.selected_debit),
    pdfMoney(statement.summary.selected_credit),
    pdfMoney(statement.summary.outstanding_loan_balance),
  ]);

  section("Transaction history");
  tableHeader([
    "Date",
    "Reference",
    "Particulars",
    "Category",
    "Debit",
    "Credit",
    "Balance",
  ]);
  if (!statement.transactions.length)
    row(["No transactions match the selected filters."]);
  for (const item of statement.transactions)
    row([
      displayDate(item.date),
      item.reference_number ?? "-",
      `${item.transaction_type}${item.description ? ` - ${item.description}` : ""}`.slice(
        0,
        34,
      ),
      item.category ?? "-",
      item.direction === "debit" ? pdfMoney(item.amount) : "-",
      item.direction === "credit" ? pdfMoney(item.amount) : "-",
      pdfMoney(item.running_balance),
    ]);

  section("Active loans");
  tableHeader([
    "Loan / reference",
    "Principal",
    "Outstanding",
    "Start",
    "Term",
    "Next payment",
    "Status",
  ]);
  if (!statement.loans.length) row(["No active loans."]);
  for (const loan of statement.loans)
    row([
      `${loan.type} ${loan.account_number ?? ""}`,
      pdfMoney(loan.principal),
      pdfMoney(loan.outstanding_balance),
      displayDate(loan.start_date),
      loan.term_count
        ? `${loan.term_count} ${loan.installment_frequency}`
        : "-",
      displayDate(loan.next_payment_date),
      loan.status,
    ]);

  section("Loan payment schedules");
  if (!statement.loans.length) row(["No payment schedules."]);
  for (const loan of statement.loans) {
    line(`${loan.type} - ${loan.account_number ?? "No reference"}`, {
      font: bold,
    });
    tableHeader(["#", "Due date", "Scheduled", "Paid", "Remaining", "Status"]);
    if (!loan.schedules.length) row(["No schedule rows."]);
    for (const schedule of loan.schedules)
      row([
        String(schedule.installment_number),
        displayDate(schedule.due_date),
        pdfMoney(schedule.scheduled_amount),
        pdfMoney(schedule.amount_paid),
        pdfMoney(schedule.remaining_amount),
        schedule.status,
      ]);
  }

  section("Rebate history");
  tableHeader(["Date", "Type", "Reference", "Amount", "Description"]);
  if (!statement.rebates.length) row(["No rebates."]);
  for (const rebate of statement.rebates)
    row([
      displayDate(rebate.date),
      rebate.type,
      rebate.reference_number ?? "-",
      pdfMoney(rebate.amount),
      rebate.description ?? "-",
    ]);

  section("Related attachments");
  tableHeader(["Filename", "Category", "Related record", "Document date"]);
  if (!statement.attachments.length) row(["No related attachments."]);
  for (const attachment of statement.attachments)
    row([
      attachment.filename,
      attachment.category,
      attachment.related_record,
      displayDate(attachment.date),
    ]);

  pages.forEach((item, index) => {
    item.drawText("System-generated statement", {
      x: MARGIN,
      y: 22,
      size: 7.5,
      font: regular,
      color: rgb(0.35, 0.35, 0.35),
    });
    item.drawText(`Page ${index + 1} of ${pages.length}`, {
      x: 500,
      y: 22,
      size: 7.5,
      font: regular,
      color: rgb(0.35, 0.35, 0.35),
    });
  });
  const generatedDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
  }).format(new Date(statement.generated_at));
  const filename = `statement-of-account-${safeFilenamePart(statement.employee.employee_number)}-${generatedDate}.pdf`;
  return new Response(new Uint8Array(await pdf.save()), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
