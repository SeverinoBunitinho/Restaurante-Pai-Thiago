export function SectionHeading({
  eyebrow,
  title,
  description,
  compact = false,
}) {
  return (
    <div className={compact ? "max-w-2xl" : "max-w-4xl"}>
      <span className="section-eyebrow">{eyebrow}</span>
      <div className="mt-5 flex items-center gap-4">
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(182,135,66,0.28),rgba(20,35,29,0.02))]" />
        <div className="hidden h-2.5 w-2.5 rounded-full bg-[var(--gold-soft)] shadow-[0_0_18px_rgba(217,185,122,0.55)] sm:block" />
      </div>
      <h2
        className={`display-title page-section-title mt-5 text-balance text-[var(--forest)] ${
          compact ? "max-w-3xl" : ""
        }`}
      >
        {title}
      </h2>
      <p className="page-lead mt-5 max-w-3xl text-[var(--ink-soft)]">
        {description}
      </p>
    </div>
  );
}
