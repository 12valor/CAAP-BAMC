import { SpreadsheetFile, Workbook } from "file:///C:/Users/evang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";
import fs from "node:fs/promises";
import ExcelJS from "exceljs";

const outputDir = new URL("../tests/fixtures/", import.meta.url);
await fs.mkdir(outputDir, { recursive: true });
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Employees");
const headers = ["employee_number","username","first_name","middle_name","last_name","suffix","department","position_title","employment_category","employment_status","hire_date","email","phone","notes"];
sheet.getRange("A1:N2").values = [headers,["SYN-0001","synthetic.user","Synthetic","Q","Employee","","Testing","Fixture","Test","active","2026-01-15","synthetic@example.test","00000000000","Synthetic test data only"]];
sheet.getRange("A1:N1").format = { fill:"#155E9A", font:{ bold:true, color:"#FFFFFF" }, wrapText:true, borders:{ preset:"all", style:"thin", color:"#D8E1EA" } };
sheet.getRange("A2:N2").format = { fill:"#F8FAFC", borders:{ preset:"all", style:"thin", color:"#D8E1EA" } };
sheet.getRange("A1:N2").format.autofitColumns();
sheet.freezePanes.freezeRows(1);
const inspection = await workbook.inspect({ kind:"region", sheetId:"Employees", range:"A1:N2", maxChars:3000 });
console.log(inspection.ndjson);
const preview = await workbook.render({ sheetName:"Employees", autoCrop:"all", scale:1, format:"png" });
await fs.writeFile(new URL("synthetic-import-preview.png", outputDir), new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(new URL("synthetic-import-artifact.xlsx", outputDir).pathname.replace(/^\//, ""));

// ExcelJS is also the production parser, so export a compatibility fixture
// from the same inspected values to catch parser regressions directly.
const compatible = new ExcelJS.Workbook();
const compatibleSheet = compatible.addWorksheet("Employees");
compatibleSheet.addRows([headers,["SYN-0001","synthetic.user","Synthetic","Q","Employee","","Testing","Fixture","Test","active","2026-01-15","synthetic@example.test","00000000000","Synthetic test data only"]]);
compatibleSheet.getRow(1).font = { bold:true, color:{argb:"FFFFFFFF"} };
compatibleSheet.getRow(1).fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF155E9A"} };
compatibleSheet.views = [{ state:"frozen", ySplit:1 }];
compatibleSheet.columns = headers.map(header=>({ width:Math.max(16,header.length+3), style:{ numFmt:"@" } }));
await compatible.xlsx.writeFile(new URL("synthetic-import.xlsx", outputDir).pathname.replace(/^\//, ""));
