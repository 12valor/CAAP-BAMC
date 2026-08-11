"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function PreviewPrimaryAction({ label }: { label: string }) {
  return (
    <Button
      type="button"
      onClick={() => toast.info(`${label} is available in a later phase.`)}
    >
      <Plus aria-hidden="true" />
      {label}
    </Button>
  );
}
