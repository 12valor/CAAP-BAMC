import ExcelJS from "exceljs";
import { createHash } from "node:crypto";

export const IMPORT_SHEETS = {
  Employees:["employee_number","username","first_name","middle_name","last_name","suffix","department","position_title","employment_category","employment_status","hire_date","email","phone","notes"],
  OpeningBalances:["employee_number","type_code","date","direction","amount","reference_number","description"],
  Transactions:["employee_number","type_code","date","direction","amount","reference_number","description"],
  Loans:["employee_number","loan_type_code","account_number","start_date","maturity_date","principal","interest_rate","total_payable","term_count","schedule_method","status","notes"],
  LoanSchedules:["loan_type_code","account_number","installment_number","due_date","principal_due","interest_due","penalty_due","other_due","total_due","generation_method","status"],
  LoanPayments:["loan_type_code","account_number","payment_date","amount","reference_number","notes"],
  Rebates:["employee_number","rebate_type_code","rebate_date","amount","status","reason"],
  LeaveBalances:["employee_number","leave_type_code","date","quantity_delta","notes"],
  LeaveHistory:["employee_number","leave_type_code","date","entry_kind","quantity_delta","reference_number","notes"],
  DocumentMetadata:["employee_number","category_code","storage_object_path","filename","mime_type","size_bytes","document_date","employee_visible","metadata_json"],
} as const;
export type ImportEntity="employees"|"opening_balances"|"transactions"|"loans"|"loan_schedules"|"loan_payments"|"rebates"|"leave_balances"|"leave_history"|"document_metadata";
const entityBySheet:Record<keyof typeof IMPORT_SHEETS,ImportEntity>={Employees:"employees",OpeningBalances:"opening_balances",Transactions:"transactions",Loans:"loans",LoanSchedules:"loan_schedules",LoanPayments:"loan_payments",Rebates:"rebates",LeaveBalances:"leave_balances",LeaveHistory:"leave_history",DocumentMetadata:"document_metadata"};
export type ParsedImportRow={rowNumber:number;entityType:ImportEntity;data:Record<string,string|boolean|Record<string,unknown>>;errors:string[];warnings:string[]};
const moneyFields=new Set(["amount","principal","interest_rate","total_payable","principal_due","interest_due","penalty_due","other_due","total_due","quantity_delta"]);
const dateFields=new Set(["date","hire_date","start_date","maturity_date","due_date","payment_date","rebate_date","document_date"]);
const required:Record<ImportEntity,string[]>={employees:["employee_number","first_name","last_name"],opening_balances:["employee_number","type_code","date","direction","amount"],transactions:["employee_number","type_code","date","direction","amount"],loans:["employee_number","loan_type_code","account_number","start_date","principal"],loan_schedules:["loan_type_code","account_number","installment_number","due_date","total_due"],loan_payments:["loan_type_code","account_number","payment_date","amount"],rebates:["employee_number","rebate_type_code","rebate_date","amount"],leave_balances:["employee_number","leave_type_code","date","quantity_delta"],leave_history:["employee_number","leave_type_code","date","entry_kind","quantity_delta"],document_metadata:["employee_number","category_code","storage_object_path","filename","mime_type","size_bytes"]};
const decimal=/^-?\d+(?:\.\d+)?$/;
const isoDate=/^\d{4}-\d{2}-\d{2}$/;

function cellText(cell:ExcelJS.Cell){const value=cell.value;if(value===null||value===undefined)return"";if(value instanceof Date)return value.toISOString().slice(0,10);if(typeof value==="object"&&"text" in value)return String(value.text).trim();return String(value).trim();}
export async function parseImportWorkbook(buffer:ArrayBuffer){
  const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(Buffer.from(buffer) as never);const rows:ParsedImportRow[]=[];let sequence=0;
  for(const [sheetName,headers] of Object.entries(IMPORT_SHEETS) as [keyof typeof IMPORT_SHEETS,readonly string[]][]){const sheet=workbook.getWorksheet(sheetName);if(!sheet)continue;const actual=sheet.getRow(1).values as unknown[];const matches=headers.every((h,i)=>String(actual[i+1]??"").trim()===h);if(!matches)throw new Error(`${sheetName} does not match the standard template headers.`);for(let n=2;n<=sheet.rowCount;n++){const row=sheet.getRow(n);if(!row.hasValues)continue;sequence++;const entityType=entityBySheet[sheetName];const data:Record<string,string|boolean|Record<string,unknown>>={};const errors:string[]=[];const warnings:string[]=[];headers.forEach((header,index)=>{const cell=row.getCell(index+1);const text=cellText(cell);if(header==="metadata_json"&&text){try{const parsed=JSON.parse(text);if(!parsed||Array.isArray(parsed)||typeof parsed!=="object")throw new Error();data.metadata=parsed;}catch{errors.push("metadata_json must be a JSON object.");}}else if(header==="employee_visible")data[header]=["true","yes","1"].includes(text.toLowerCase());else data[header]=text;if(moneyFields.has(header)&&text){if(typeof cell.value==="number")warnings.push(`${header} was numeric; text-formatted money is recommended for exact import.`);if(!decimal.test(text))errors.push(`${header} must be an exact decimal value.`);}if(dateFields.has(header)&&text&&!isoDate.test(text))errors.push(`${header} must use YYYY-MM-DD.`);});for(const field of required[entityType])if(!String(data[field]??"").trim())errors.push(`${field} is required.`);if(["opening_balances","transactions"].includes(entityType)&&!["debit","credit"].includes(String(data.direction)))errors.push("direction must be debit or credit.");rows.push({rowNumber:sequence,entityType,data,errors,warnings});}}
  if(!rows.length)throw new Error("The workbook does not contain any import rows.");
  return{rows,digest:createHash("sha256").update(Buffer.from(buffer)).digest("hex")};
}

export async function createImportTemplate(){
  const workbook=new ExcelJS.Workbook();workbook.creator="CAAP BAMC";const guide=workbook.addWorksheet("Instructions");guide.columns=[{width:24},{width:90}];guide.addRows([["CAAP BAMC Import Template","Enter data only in the named sheets. Delete sample rows before upload."],["Safe workflow","Upload creates a preview only. Nothing is imported until an administrator confirms an error-free job."],["Money","Use text-formatted exact decimal values without currency symbols."],["Dates","Use YYYY-MM-DD."],["Accounts","Usernames are checked for duplicates but Auth accounts and passwords are never created by workbook import."],["References","Unknown type/category codes must be mapped explicitly before confirmation."]]);guide.getRow(1).font={bold:true,size:14};
  for(const [name,headers] of Object.entries(IMPORT_SHEETS)){const sheet=workbook.addWorksheet(name);sheet.addRow([...headers]);sheet.getRow(1).font={bold:true,color:{argb:"FFFFFFFF"}};sheet.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF155E9A"}};sheet.views=[{state:"frozen",ySplit:1}];sheet.autoFilter={from:"A1",to:`${String.fromCharCode(64+Math.min(headers.length,26))}1`};sheet.columns=headers.map(h=>({key:h,width:Math.max(16,Math.min(28,h.length+4)),style:{numFmt:"@"}}));}
  return workbook.xlsx.writeBuffer();
}
