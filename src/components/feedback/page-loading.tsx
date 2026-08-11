export function PageLoading({ label = "Loading page" }: { label?: string }) {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16"
    >
      <div className="w-full max-w-xl space-y-4" role="status">
        <span className="sr-only">{label}</span>
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    </main>
  );
}
