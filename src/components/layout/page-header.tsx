type PageHeaderProps = {
  actions?: React.ReactNode;
  description?: string;
  title: string;
};

export function PageHeader({
  actions,
  description,
  title,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
