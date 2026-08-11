import type { SummaryFixture } from "@/fixtures/design-preview";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const badgeVariantByStatus = {
  neutral: "secondary",
  success: "success",
  warning: "warning",
  info: "info",
} as const;

export function SummaryGrid({ items }: { items: readonly SummaryFixture[] }) {
  return (
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="sr-only">
        Preview summary
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardDescription className="text-base">
                {item.label}
              </CardDescription>
              <CardTitle className="text-3xl font-bold tracking-tight">
                {item.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={badgeVariantByStatus[item.status]}>
                {item.helper}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
