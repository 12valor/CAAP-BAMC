"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AdminSafetyConfirmationProps = {
  confirmLabel: string;
  description: string;
  onConfirm: (reason: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending?: boolean;
  requireReason?: boolean;
  title: string;
  trigger?: ReactNode;
  variant?: "default" | "destructive";
};

export function AdminSafetyConfirmation({
  confirmLabel,
  description,
  onConfirm,
  open,
  onOpenChange,
  pending = false,
  requireReason = true,
  title,
  trigger,
  variant = "destructive",
}: AdminSafetyConfirmationProps) {
  const [reason, setReason] = useState("");

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen) setReason("");
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {requireReason ? (
          <div className="space-y-2 py-4">
            <Label htmlFor="safety-confirmation-reason">Reason</Label>
            <Textarea
              id="safety-confirmation-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              minLength={5}
            />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant={variant}
            disabled={pending || (requireReason && reason.trim().length < 5)}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
