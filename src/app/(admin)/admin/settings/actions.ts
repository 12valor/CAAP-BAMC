"use server";

import { revalidatePath } from "next/cache";
import { databaseActionError, type AdminActionResult } from "@/lib/admin-action";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { settingSchema } from "@/validation/financial";

const field=(data:FormData,key:string)=>String(data.get(key)??"");
export async function saveFinancialSettingAction(data:FormData):Promise<AdminActionResult>{
 const principal=await requireRole("admin");
 const parsed=settingSchema.safeParse({kind:field(data,"kind"),id:field(data,"id")||undefined,code:field(data,"code"),name:field(data,"name"),direction:field(data,"direction")||undefined,balanceEffect:field(data,"balanceEffect")||"neutral",strategy:field(data,"strategy")||"manual",effectiveFrom:field(data,"effectiveFrom"),effectiveTo:field(data,"effectiveTo"),percentage:field(data,"percentage"),fixedAmount:field(data,"fixedAmount"),termLength:field(data,"termLength")||undefined,frequency:field(data,"frequency")||undefined,rounding:field(data,"rounding")||undefined,referenceStrategy:field(data,"referenceStrategy")||undefined,referencePrefix:field(data,"referencePrefix"),active:field(data,"active")!=="false"});
 if(!parsed.success)return{error:parsed.error.issues[0]?.message??"Invalid setting."};
 const v=parsed.data; const common={code:v.code,name:v.name,is_active:v.active,effective_from:v.effectiveFrom,effective_to:v.effectiveTo,updated_by:principal.id};
 let payload:Record<string,unknown>=common;
 if(v.kind==="financial_categories")payload={...common,balance_effect:v.balanceEffect};
 if(v.kind==="transaction_types"){const categoryId=field(data,"financialCategoryId");if(!categoryId)return{error:"Choose a financial category."};payload={...common,financial_category_id:categoryId,direction:v.direction,balance_effect:v.balanceEffect,reference_strategy:v.referenceStrategy??"manual",reference_prefix:v.referencePrefix||null};}
 if(v.kind==="interest_methods")payload={...common,strategy:v.strategy,default_rate:v.percentage||null};
 if(v.kind==="penalty_rules")payload={...common,strategy:v.strategy,percentage_rate:v.strategy==="percentage"?v.percentage||null:null,fixed_amount:v.strategy==="fixed_amount"?v.fixedAmount||null:null};
 if(v.kind==="loan_types")payload={...common,calculation_strategy:v.strategy,default_rate:v.percentage||null,default_term_count:v.termLength??null,installment_frequency:v.frequency??"monthly",rounding_method:v.rounding??"half_up",calculation_parameters:{}};
 if(v.kind==="rebate_types")payload={...common,calculation_strategy:v.strategy,percentage_rate:v.strategy==="percentage"?v.percentage||null:null,fixed_amount:v.strategy==="fixed_amount"?v.fixedAmount||null:null,balance_effect:v.balanceEffect,rounding_method:v.rounding??"half_up",calculation_parameters:{}};
 if(!v.id)payload={...payload,created_by:principal.id};
 const admin=createAdminClient();
 const table=admin.from(v.kind) as any;
 const result=v.id?await table.update(payload).eq("id",v.id):await table.insert(payload);
 if(result.error)return{error:databaseActionError(result.error,"The financial setting could not be saved.")};
 revalidatePath("/admin/settings"); return{success:`${v.name} saved.`};
}

export async function setFinancialSettingStatusAction(data:FormData):Promise<AdminActionResult>{
 const principal=await requireRole("admin"); const kind=field(data,"kind"); const id=field(data,"id");
 if(!["financial_categories","transaction_types","interest_methods","penalty_rules","loan_types","rebate_types"].includes(kind)||!/^[0-9a-f-]{36}$/i.test(id))return{error:"Invalid setting."};
 const admin=createAdminClient(); const {error}=await (admin.from(kind as "loan_types") as any).update({is_active:field(data,"active")==="true",updated_by:principal.id}).eq("id",id);
 if(error)return{error:databaseActionError(error,"Status could not be changed.")}; revalidatePath("/admin/settings"); return{success:"Setting status updated."};
}
