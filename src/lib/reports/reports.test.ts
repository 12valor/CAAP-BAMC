import { describe, expect, it } from "vitest";
import { auditDifferences, formatExactMoney, sanitizeAuditValue } from "./format";
import { currentMonthManila, parseReportFilters } from "./validation";

describe("Phase 11 report helpers",()=>{
  it("uses the Manila calendar month",()=>{expect(currentMonthManila(new Date("2026-08-12T00:00:00Z"))).toEqual({start:"2026-08-01",end:"2026-08-31"})});
  it("rejects invalid filters without exposing arbitrary report names",()=>{expect(parseReportFilters({report:"secrets",employee:"not-a-uuid"}).report).toBe("statement")});
  it("formats exact decimal strings without Number conversion",()=>{expect(formatExactMoney("12345678901234567890.125")).toBe("PHP 12,345,678,901,234,567,890.125")});
  it("removes sensitive audit keys and returns safe differences",()=>{const safe=sanitizeAuditValue({name:"Employee",password:"hidden",nested:{signed_url:"hidden",status:"active"}});expect(safe).toEqual({name:"Employee",nested:{status:"active"}});expect(auditDifferences({status:"active",token:"x"},{status:"inactive",token:"y"})).toEqual([{field:"status",before:"active",after:"inactive"}])});
});
