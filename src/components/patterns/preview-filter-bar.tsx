"use client";

import { useState } from "react";
import { RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PreviewFilterBar() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  function resetFilters() {
    setQuery("");
    setStatus("all");
  }

  return (
    <form
      aria-label="Preview filters"
      className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-end"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <Label htmlFor="preview-search">Search records</Label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="preview-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Search by name or reference"
          />
        </div>
      </div>
      <div className="space-y-1.5 sm:w-52">
        <Label htmlFor="preview-status">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="preview-status" className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="recorded">Recorded</SelectItem>
            <SelectItem value="review">For review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="button" variant="outline" onClick={resetFilters}>
        <RotateCcw aria-hidden="true" />
        Reset filters
      </Button>
    </form>
  );
}
