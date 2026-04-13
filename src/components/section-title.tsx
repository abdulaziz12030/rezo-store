export function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="text-xs font-semibold tracking-[0.35em] text-brand-gold">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold text-brand-navy sm:text-4xl">{title}</h2>
      {text ? <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base">{text}</p> : null}
    </div>
  )
}
