export default function TimelineItem({ title, subtitle, meta, status }) {
  const statusStyles = {
    paid: "bg-emerald-500/10 text-emerald-600",
    due: "bg-amber-500/10 text-amber-600",
    late: "bg-rose-500/10 text-rose-600",
  };

  return (
    <div className="flex items-start gap-4 rounded-3xl border border-slate-100 bg-white px-5 py-4">
      <div className={`mt-1 h-3 w-3 rounded-full ${statusStyles[status] || "bg-slate-200"}`} />
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="text-xs text-slate-400">{meta}</div>
    </div>
  );
}
