import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Audit Log" };

export default async function AuditLogPage() {
  await requireRole("admin");
  const admin = createAdminClient();
  const { data: activities, error } = await admin
    .from("login_activity")
    .select("id, occurred_at, profile_id, outcome, user_agent")
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error("Unable to load login activity.");
  }

  const profileIds = activities
    .map((activity) => activity.profile_id)
    .filter((profileId): profileId is string => Boolean(profileId));
  const { data: profiles } = profileIds.length
    ? await admin.from("profiles").select("id, display_name").in("id", profileIds)
    : { data: [] };
  const displayNames = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.display_name]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administrator workspace"
        title="Login activity"
        description="Review recent successful, failed, disabled, rate-limited, expired-session, and logout events. Network and username identifiers remain hashed."
        preview={false}
      />
      <Card>
        <CardHeader>
          <CardTitle>Recent authentication events</CardTitle>
          <CardDescription>Showing up to the latest 100 append-only records.</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No login activity has been recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date and time</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Client</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      {new Intl.DateTimeFormat("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Manila",
                      }).format(new Date(activity.occurred_at))}
                    </TableCell>
                    <TableCell>
                      {activity.profile_id
                        ? (displayNames.get(activity.profile_id) ?? "Known account")
                        : "Unknown username"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          activity.outcome === "success"
                            ? "success"
                            : activity.outcome === "logout"
                              ? "info"
                              : activity.outcome === "rate_limited"
                                ? "warning"
                                : "destructive"
                        }
                      >
                        {activity.outcome.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-72 truncate text-muted-foreground">
                      {activity.user_agent ?? "Not available"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
