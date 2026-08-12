import { createImportTemplate } from "@/lib/imports/workbook";
import { getCurrentPrincipal } from "@/lib/permissions/authorization";
export async function GET(){const p=await getCurrentPrincipal();if(p?.role!=="admin")return new Response("Unauthorized",{status:401});const bytes=await createImportTemplate();return new Response(new Uint8Array(bytes),{headers:{"content-type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","content-disposition":"attachment; filename=caap-bamc-import-template.xlsx","cache-control":"no-store"}})}
