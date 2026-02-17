export default function Tag({ children, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary-50 text-primary-700',
    success: 'bg-emerald-50 text-emerald-600',
    danger: 'bg-rose-50 text-rose-600'
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
