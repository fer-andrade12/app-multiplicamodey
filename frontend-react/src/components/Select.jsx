export default function Select({ label, options = [], ...props }) {
  return (
    <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
      {label}
      <select
        className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink shadow-sm focus:border-primary-500 focus:outline-none"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
