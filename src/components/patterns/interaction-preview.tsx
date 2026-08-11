"use client";

import { useState } from "react";
import { FilePenLine, MessageSquareText, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InteractionPreview() {
  const [dialogOpen, setDialogOpen] = useState(false);

  function submitPreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDialogOpen(false);
    toast.success("Preview form completed", {
      description: "No record was created or saved.",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dialogs and notifications</CardTitle>
        <CardDescription>
          Keyboard-accessible interaction patterns for future workflows.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <FilePenLine aria-hidden="true" />
              Open form dialog
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={submitPreview}>
              <DialogHeader>
                <DialogTitle>Preview record form</DialogTitle>
                <DialogDescription>
                  Review label placement, control sizing, and keyboard order.
                  This form does not save data.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-5">
                <div className="space-y-1.5">
                  <Label htmlFor="preview-name">Employee display name</Label>
                  <Input
                    id="preview-name"
                    name="preview-name"
                    defaultValue="Sample Employee"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preview-category">Category</Label>
                  <Select defaultValue="transaction">
                    <SelectTrigger id="preview-category" className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transaction">Transaction</SelectItem>
                      <SelectItem value="loan">Loan</SelectItem>
                      <SelectItem value="leave">Leave record</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Complete preview</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <ShieldAlert aria-hidden="true" />
              Open confirmation alert
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-status-warning-muted text-status-warning">
                <ShieldAlert aria-hidden="true" />
              </AlertDialogMedia>
              <AlertDialogTitle>Mark preview record inactive?</AlertDialogTitle>
              <AlertDialogDescription>
                Future financial records will use soft deletion with an audit
                entry. This preview does not change any data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep record</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  toast.info("Confirmation pattern reviewed", {
                    description: "No record was changed.",
                  })
                }
              >
                Confirm preview
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          variant="outline"
          onClick={() =>
            toast.success("Preview notification", {
              description: "This toast confirms the shared success pattern.",
            })
          }
        >
          <MessageSquareText aria-hidden="true" />
          Show toast notification
        </Button>
      </CardContent>
    </Card>
  );
}
