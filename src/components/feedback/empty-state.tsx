import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  description: string;
  icon?: LucideIcon;
  title: string;
};

export function EmptyState({
  description,
  icon: Icon = Inbox,
  title,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
          <Icon aria-hidden="true" className="size-6" />
        </div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 max-w-md text-base leading-7 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
