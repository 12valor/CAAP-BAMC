import {
  adminSummaryFixtures,
  employeeSummaryFixtures,
} from "@/fixtures/design-preview";
import type { NavigationRole } from "@/config/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { PreviewNotice } from "@/components/feedback/preview-notice";
import { TableSkeleton } from "@/components/feedback/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { InteractionPreview } from "@/components/patterns/interaction-preview";
import { PreviewDataTable } from "@/components/patterns/preview-data-table";
import { PreviewFilterBar } from "@/components/patterns/preview-filter-bar";
import { PreviewPrimaryAction } from "@/components/patterns/preview-primary-action";
import { SummaryGrid } from "@/components/patterns/summary-grid";

export function DashboardPreview({ role }: { role: NavigationRole }) {
  const isAdmin = role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? "Dashboard" : "Overview"}
        description={
          isAdmin
            ? "Review the shared staff dashboard, controls, tables, and feedback patterns before business modules are connected."
            : "Review the read-only employee shell and account-summary patterns before personal financial data is connected."
        }
        actions={
          <PreviewPrimaryAction
            label={isAdmin ? "Create record" : "Download statement"}
          />
        }
      />
      <PreviewNotice />
      <SummaryGrid
        items={isAdmin ? adminSummaryFixtures : employeeSummaryFixtures}
      />
      <PreviewFilterBar />
      <PreviewDataTable />
      {isAdmin ? <InteractionPreview /> : null}
      <section
        aria-labelledby="feedback-patterns-heading"
        className="space-y-3"
      >
        <div>
          <h2 id="feedback-patterns-heading" className="text-lg font-bold">
            Empty and loading patterns
          </h2>
          <p className="mt-1 text-base text-muted-foreground">
            Reusable states keep unavailable or loading information explicit.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <EmptyState
            title="No matching preview records"
            description="Adjust the filters or create a record after the appropriate business phase is approved."
          />
          <TableSkeleton />
        </div>
      </section>
    </div>
  );
}
