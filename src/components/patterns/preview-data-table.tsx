import { activityFixtures } from "@/fixtures/design-preview";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusVariant = {
  Recorded: "info",
  "For review": "warning",
  Completed: "success",
} as const;

export function PreviewDataTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent preview activity</CardTitle>
        <CardDescription>
          A responsive table pattern using synthetic display fixtures.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableCaption className="px-4 pb-4 text-left">
            Preview records only. No business data is loaded.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Reference</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="pr-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activityFixtures.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="pl-4 font-mono text-xs font-semibold">
                  {item.id}
                </TableCell>
                <TableCell className="font-medium">{item.employee}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.amount}
                </TableCell>
                <TableCell className="pr-4">
                  <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
