import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { AdminFormActions, AdminFormLayout } from "@/components/admin/admin-form-layout";
import { AdminSafetyConfirmation } from "@/components/admin/admin-safety-confirmation";
import { AdminTableFrame, AdminTableToolbar } from "@/components/admin/admin-table-toolbar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

describe("simplified admin patterns", () => {
  it("renders a concise page header with optional actions", () => {
    render(<PageHeader title="Employees" actions={<Button>Add employee</Button>} />);

    expect(screen.getByRole("heading", { level: 1, name: "Employees" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add employee" })).toBeInTheDocument();
    expect(screen.queryByText(/administrator workspace/i)).not.toBeInTheDocument();
  });

  it("composes a table toolbar and dedicated form actions", () => {
    render(
      <>
        <AdminTableFrame>
          <AdminTableToolbar>
            <label htmlFor="search">Search</label>
            <input id="search" />
          </AdminTableToolbar>
        </AdminTableFrame>
        <AdminFormLayout title="Add employee" backHref="/admin/employees">
          <form>
            <AdminFormActions
              cancelHref="/admin/employees"
              pending={false}
              submitLabel="Save employee"
            />
          </form>
        </AdminFormLayout>
      </>,
    );

    expect(screen.getByLabelText("Search")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
      "href",
      "/admin/employees",
    );
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      "/admin/employees",
    );
    expect(screen.getByRole("button", { name: "Save employee" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("requires a reason before a sensitive action can be confirmed", () => {
    const onConfirm = vi.fn();

    function ConfirmationHarness() {
      const [open, setOpen] = useState(false);
      return (
        <AdminSafetyConfirmation
          open={open}
          onOpenChange={setOpen}
          title="Archive employee?"
          description="The record remains auditable."
          confirmLabel="Archive"
          onConfirm={onConfirm}
          trigger={<Button>Archive employee</Button>}
        />
      );
    }

    render(<ConfirmationHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Archive employee" }));

    const confirm = screen.getByRole("button", { name: "Archive" });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Record archived after separation" },
    });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith("Record archived after separation");
  });
});
