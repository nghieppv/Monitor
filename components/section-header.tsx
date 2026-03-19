export function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Monitoring dashboard</p>
      <h2 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h2>
      <p className="max-w-3xl text-sm text-slate-600">{description}</p>
    </div>
  );
}
