import Card from './Card.jsx';

export default function StatCard({ label, value, hint, tone = 'primary' }) {
  const tones = {
    primary: 'text-primary-600',
    success: 'text-success',
    danger: 'text-danger'
  };

  return (
    <Card>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
    </Card>
  );
}
