"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Landmark,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { toast } from "sonner";

import {
  navigationByRole,
  type NavigationItem,
  type NavigationRole,
} from "@/config/navigation";
import { logoutAction } from "@/app/auth-actions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AppShellProps = {
  children: React.ReactNode;
  role: NavigationRole;
  user: {
    displayName: string;
    roleLabel: string;
  };
};

type NavigationLinkProps = {
  collapsed?: boolean;
  item: NavigationItem;
  mobile?: boolean;
  pathname: string;
};

function isNavigationItemActive(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  const isSectionRoot =
    href === "/admin/dashboard" || href === "/portal/overview";
  return !isSectionRoot && pathname.startsWith(`${href}/`);
}

function NavigationLink({
  collapsed = false,
  item,
  mobile = false,
  pathname,
}: NavigationLinkProps) {
  const active = isNavigationItemActive(pathname, item.href);
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-[0.9375rem] font-medium text-sidebar-foreground transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/35",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active &&
          "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      <span className={cn(collapsed && "sr-only")}>{item.label}</span>
    </Link>
  );

  if (mobile) {
    return <SheetClose asChild>{link}</SheetClose>;
  }

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

function NavigationList({
  collapsed = false,
  mobile = false,
  pathname,
  role,
}: {
  collapsed?: boolean;
  mobile?: boolean;
  pathname: string;
  role: NavigationRole;
}) {
  return (
    <nav
      aria-label={role === "admin" ? "Admin navigation" : "Employee navigation"}
      className="flex flex-col gap-1"
    >
      {navigationByRole[role].map((item) => (
        <NavigationLink
          key={item.href}
          collapsed={collapsed}
          item={item}
          mobile={mobile}
          pathname={pathname}
        />
      ))}
    </nav>
  );
}

function ProductIdentity({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-16 items-center gap-3 px-4",
        collapsed && "justify-center px-2",
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Landmark aria-hidden="true" className="size-5" />
      </div>
      <div className={cn("min-w-0", collapsed && "sr-only")}>
        <p className="truncate text-sm font-bold tracking-wide text-sidebar-foreground">
          CAAP BAMC
        </p>
        <p className="truncate text-xs text-muted-foreground">
          Financial Records
        </p>
      </div>
    </div>
  );
}

function initialsFor(displayName: string) {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppShell({ children, role, user }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const initials = initialsFor(user.displayName) || "U";
  const currentItem =
    navigationByRole[role].find((item) =>
      isNavigationItemActive(pathname, item.href),
    ) ?? navigationByRole[role][0];

  return (
    <TooltipProvider delayDuration={250}>
      <div className="min-h-screen bg-background">
        <a
          href="#main-content"
          className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground focus:translate-y-0"
        >
          Skip to main content
        </a>

        <aside
          id="desktop-sidebar-navigation"
          data-collapsed={collapsed}
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-150 lg:flex",
            collapsed
              ? "w-[var(--app-sidebar-collapsed-width)]"
              : "w-[var(--app-sidebar-width)]",
          )}
        >
          <ProductIdentity collapsed={collapsed} />
          <Separator />
          <div className="flex-1 overflow-y-auto p-3">
            <NavigationList
              collapsed={collapsed}
              pathname={pathname}
              role={role}
            />
          </div>
          <Separator />
          <div
            className={cn(
              "flex min-h-20 items-center gap-3 p-3",
              collapsed && "justify-center",
            )}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground">
              {initials}
            </div>
            <div className={cn("min-w-0", collapsed && "sr-only")}>
              <p className="truncate text-sm font-semibold">{user.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.roleLabel}
              </p>
            </div>
          </div>
        </aside>

        <div
          className={cn(
            "min-w-0 transition-[padding] duration-150",
            collapsed
              ? "lg:pl-[var(--app-sidebar-collapsed-width)]"
              : "lg:pl-[var(--app-sidebar-width)]",
          )}
        >
          <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b bg-background/95 px-4 supports-backdrop-filter:backdrop-blur-sm sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Menu aria-hidden="true" />
                    Menu
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[min(88vw,20rem)] gap-0 p-0"
                >
                  <SheetHeader className="sr-only">
                    <SheetTitle>Application navigation</SheetTitle>
                    <SheetDescription>
                      Choose a section of the financial records system.
                    </SheetDescription>
                  </SheetHeader>
                  <ProductIdentity />
                  <Separator />
                  <div className="flex-1 overflow-y-auto p-3">
                    <NavigationList mobile pathname={pathname} role={role} />
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.roleLabel}
                      </p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="outline"
                className="hidden lg:inline-flex"
                onClick={() => setCollapsed((value) => !value)}
                aria-expanded={!collapsed}
                aria-controls="desktop-sidebar-navigation"
              >
                {collapsed ? (
                  <PanelLeftOpen aria-hidden="true" />
                ) : (
                  <PanelLeftClose aria-hidden="true" />
                )}
                {collapsed ? "Expand sidebar" : "Collapse sidebar"}
              </Button>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {currentItem.label}
                </p>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  {user.roleLabel}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                aria-label="Notifications, 0 unread"
                onClick={() => toast.info("No preview notifications")}
              >
                <Bell aria-hidden="true" />
                <span className="hidden sm:inline">Notifications</span>
                <Badge variant="info" className="ml-1">
                  0
                </Badge>
              </Button>
              <form action={logoutAction}>
                <Button type="submit" variant="outline">
                  <LogOut aria-hidden="true" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </form>
            </div>
          </header>

          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-[var(--app-content-max-width)] p-4 outline-none sm:p-6 lg:p-8"
          >
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
