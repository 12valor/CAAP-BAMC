import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FoundationPage } from "@/components/layout/foundation-page";

describe("FoundationPage", () => {
  it("renders a labelled primary heading and description", () => {
    render(
      <FoundationPage
        eyebrow="Phase 0"
        title="Foundation ready"
        description="No business modules are implemented."
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Foundation ready", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No business modules are implemented."),
    ).toBeInTheDocument();
  });
});
