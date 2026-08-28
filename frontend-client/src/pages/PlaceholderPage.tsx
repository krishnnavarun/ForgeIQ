type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl items-center justify-center">
      <section className="max-w-lg text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          ForgeIQ workspace
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
      </section>
    </div>
  );
}