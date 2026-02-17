export default function ListItem({ title, subtitle, meta }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-white px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="text-xs text-slate-400">{meta}</div>
    </div>
  );
}
