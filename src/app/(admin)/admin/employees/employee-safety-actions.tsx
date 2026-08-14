"use client";

import { Archive, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { archiveEmployeeAction } from "./actions";
import { AdminSafetyConfirmation } from "@/components/admin/admin-safety-confirmation";
import { Button } from "@/components/ui/button";

export function EmployeeSafetyActions({
  archived,
  employeeId,
}: {
  archived: boolean;
  employeeId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm(reason: string) {
    const data = new FormData();
    data.set("employeeId", employeeId);
    data.set("operation", archived ? "restore" : "archive");
    data.set("reason", reason);

    startTransition(async () => {
      const result = await archiveEmployeeAction(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AdminSafetyConfirmation
      open={open}
      onOpenChange={setOpen}
      pending={pending}
      title={archived ? "Restore employee?" : "Archive employee?"}
      description={
        archived
          ? "The employee will return to current records."
          : "The record remains auditable and linked access is disabled."
      }
      confirmLabel={archived ? "Restore" : "Archive"}
      variant={archived ? "default" : "destructive"}
      onConfirm={confirm}
      trigger={
        <Button variant={archived ? "outline" : "destructive"}>
          {archived ? <RotateCcw /> : <Archive />}
          {archived ? "Restore" : "Archive"}
        </Button>
      }
    />
  );
}
