import { expect, test } from "@playwright/test";

test("redirects unauthenticated root visitors to the login screen", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
