import { expect, test, type Page } from "@playwright/test";

const adminCredentials = {
  username: process.env.E2E_ADMIN_USERNAME,
  password: process.env.E2E_ADMIN_PASSWORD,
};
const employeeCredentials = {
  username: process.env.E2E_EMPLOYEE_A_USERNAME,
  password: process.env.E2E_EMPLOYEE_A_PASSWORD,
  employeeId: process.env.E2E_EMPLOYEE_A_ID,
  otherEmployeeId: process.env.E2E_EMPLOYEE_B_ID,
};

async function login(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("unauthenticated users cannot access protected routes", async ({
  page,
}) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(
    /\/login\?reason=(?:sign-in-required|session-expired)/,
  );
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await page.goto("/statement-of-account");
  await expect(page).toHaveURL(
    /\/login\?reason=(?:sign-in-required|session-expired)/,
  );
});

test("an employee cannot access administrator pages", async ({ page }) => {
  test.skip(
    !employeeCredentials.username || !employeeCredentials.password,
    "Provide isolated E2E employee credentials to run authenticated authorization tests.",
  );

  await login(
    page,
    employeeCredentials.username!,
    employeeCredentials.password!,
  );
  await expect(page).toHaveURL(/\/statement-of-account$/);
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/statement-of-account$/);
});

test("an administrator can access administrator pages", async ({ page }) => {
  test.skip(
    !adminCredentials.username || !adminCredentials.password,
    "Provide isolated E2E administrator credentials to run authenticated authorization tests.",
  );

  await login(page, adminCredentials.username!, adminCredentials.password!);
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("one employee cannot read another employee record", async ({ page }) => {
  test.skip(
    !employeeCredentials.username ||
      !employeeCredentials.password ||
      !employeeCredentials.employeeId ||
      !employeeCredentials.otherEmployeeId,
    "Provide two isolated E2E employee identities to run cross-employee access tests.",
  );

  await login(
    page,
    employeeCredentials.username!,
    employeeCredentials.password!,
  );
  const statuses = await page.evaluate(
    async ({ ownId, otherId }) => {
      const [own, other] = await Promise.all([
        fetch(`/api/portal/employee-records/${ownId}`),
        fetch(`/api/portal/employee-records/${otherId}`),
      ]);
      return { own: own.status, other: other.status };
    },
    {
      ownId: employeeCredentials.employeeId!,
      otherId: employeeCredentials.otherEmployeeId!,
    },
  );

  expect(statuses.own).toBe(200);
  expect(statuses.other).toBe(404);
});

test("employee portal data routes derive identity from the session", async ({
  page,
}) => {
  test.skip(
    !employeeCredentials.username || !employeeCredentials.password,
    "Provide isolated employee credentials to verify portal data isolation.",
  );
  await login(
    page,
    employeeCredentials.username!,
    employeeCredentials.password!,
  );
  await page.goto(
    `/statement-of-account?employeeId=${employeeCredentials.otherEmployeeId ?? "00000000-0000-0000-0000-000000000000"}`,
  );
  await expect(page).toHaveURL(/\/statement-of-account/);
  await expect(
    page.getByRole("heading", { name: "Statement of Account" }),
  ).toBeVisible();
  const pdfResponse = await page.request.get(
    `/api/portal/statement.pdf?employeeId=${employeeCredentials.otherEmployeeId ?? "00000000-0000-0000-0000-000000000000"}`,
  );
  expect(pdfResponse.status()).toBe(200);
  expect(pdfResponse.headers()["content-type"]).toContain("application/pdf");
});

test("legacy employee routes redirect to the single statement", async ({
  page,
}) => {
  test.skip(
    !employeeCredentials.username || !employeeCredentials.password,
    "Provide isolated employee credentials to verify legacy redirects.",
  );
  await login(
    page,
    employeeCredentials.username!,
    employeeCredentials.password!,
  );
  for (const route of [
    "/portal/overview",
    "/portal/loans",
    "/portal/rebates",
    "/portal/leave-records",
    "/portal/documents",
    "/portal/profile",
    "/employee/statement",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/statement-of-account$/);
  }
});

test("employee statement is a single document without leave or sidebar navigation", async ({
  page,
}) => {
  test.skip(
    !employeeCredentials.username || !employeeCredentials.password,
    "Provide isolated employee credentials to verify the statement interface.",
  );
  await login(
    page,
    employeeCredentials.username!,
    employeeCredentials.password!,
  );
  await expect(
    page.getByRole("heading", { name: "Statement of Account" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Transaction history" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Active loans" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Loan payment schedules" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Rebate history" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Related attachments" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(
    page.getByText(/leave balance|leave history|leave credits/i),
  ).toHaveCount(0);
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: "Logout" })).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Transaction history" }),
  ).toBeVisible();
});
