import { Info } from "lucide-react";

export function PreviewNotice() {
  return (
    <aside
      aria-label="Fixture data notice"
      className="flex gap-3 rounded-lg border border-status-info/25 bg-status-info-muted px-4 py-3 text-status-info"
    >
      <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-semibold">Visual review only</p>
        <p className="mt-0.5 text-sm leading-6">
          All names, values, and statuses on this screen are isolated typed
          fixtures. No Supabase tables or business records are connected.
        </p>
      </div>
    </aside>
  );
}
