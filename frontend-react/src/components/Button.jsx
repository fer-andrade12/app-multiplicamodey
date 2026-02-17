export default function Button({ variant = 'primary', children, ...props }) {
  const base = 'rounded-3xl px-6 py-3 text-sm font-semibold transition';
  const styles = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-soft',
    ghost: 'border border-primary-100 bg-white text-primary-600 hover:bg-primary-50',
    subtle: 'bg-primary-50 text-primary-700 hover:bg-primary-100'
  };

  return (
    <button className={`${base} ${styles[variant]}`} {...props}>
      {children}
    </button>
  );
}
