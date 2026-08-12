// @vitest-environment node
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseImportWorkbook } from "./workbook";

describe("validated Excel import", () => {
  it("parses the synthetic standard-template fixture without importing it", async () => {
    const file = await readFile("tests/fixtures/synthetic-import.xlsx");
    const parsed = await parseImportWorkbook(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toMatchObject({ entityType: "employees", errors: [], data: { employee_number: "SYN-0001", username: "synthetic.user" } });
    expect(parsed.digest).toMatch(/^[a-f0-9]{64}$/);
  });
});
