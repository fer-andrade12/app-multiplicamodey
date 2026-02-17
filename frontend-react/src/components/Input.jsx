import { useEffect, useState } from 'react';

export default function Input({ label, format, value, onChange, ...props }) {
  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = useState(value ?? '');

  useEffect(() => {
    if (isControlled) {
      setInnerValue(value ?? '');
    }
  }, [isControlled, value]);

  const handleChange = (event) => {
    const rawValue = event.target.value;
    const nextValue = format ? format(rawValue) : rawValue;

    if (!isControlled) {
      setInnerValue(nextValue);
    }

    if (onChange) {
      onChange({
        ...event,
        target: {
          ...event.target,
          value: nextValue
        }
      });
    }
  };

  return (
    <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
      {label}
      <input
        className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink shadow-sm focus:border-primary-500 focus:outline-none"
        value={isControlled ? value : innerValue}
        onChange={handleChange}
        {...props}
      />
    </label>
  );
}
