type FoundationPageProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function FoundationPage({
  eyebrow,
  title,
  description,
}: FoundationPageProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16">
      <section aria-labelledby="page-title" className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {eyebrow}
        </p>
        <h1 id="page-title" className="text-3xl font-semibold text-foreground">
          {title}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          {description}
        </p>
      </section>
    </main>
  );
}
