export default function Card({ title, children }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-soft">
      {title ? <h3 className="mb-4 text-sm font-semibold text-primary-600">{title}</h3> : null}
      {children}
    </section>
  );
}
