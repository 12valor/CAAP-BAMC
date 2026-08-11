import { expect, test } from "@playwright/test";

test("supports keyboard access and responsive navigation", async ({ page }) => {
  await page.goto("/admin/employees");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await expect(
    page.getByRole("link", { name: "Employees", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Admin navigation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Audit Log", exact: true }),
  ).toBeVisible();
});
