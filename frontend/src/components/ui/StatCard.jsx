export default function StatCard({ label, value, hint, accent = "gold" }) {
  const accents = {
    gold: "text-a26-gold",
    pink: "text-a26-pink",
    ink: "text-a26-ink dark:text-white",
  };
  return (
    <div className="card">
      <p className="text-sm text-a26-ink/60 dark:text-neutral-400">{label}</p>
      <p className={`text-3xl font-display font-semibold mt-1 ${accents[accent]}`}>{value}</p>
      {hint && <p className="text-xs mt-1 text-a26-ink/50 dark:text-neutral-500">{hint}</p>}
    </div>
  );
}
