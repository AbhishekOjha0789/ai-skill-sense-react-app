export const TYPE_TEXT = { Technical: 'text-tech', Fitness: 'text-fit', Finance: 'text-fin', Communication: 'text-comm' };
export const TYPE_BAR = { Technical: 'bg-tech', Fitness: 'bg-fit', Finance: 'bg-fin', Communication: 'bg-comm' };

export function Card({ as: Tag = 'div', className = '', children, ...props }) {
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
  };
  return (
    <Tag onMouseMove={move} className={`spot rounded-xl border border-line bg-ink-900 ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function Btn({ as: Tag = 'button', variant = 'primary', className = '', ...props }) {
  const look = variant === 'primary' ? 'bg-gold text-ink-950 hover:brightness-110' : 'border border-line hover:bg-ink-800';
  return <Tag className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${look} ${className}`} {...props} />;
}

export function Bar({ value, color = 'bg-gold', label }) {
  const pct = Math.round(Math.min(1, value) * 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-ink-800">
      <div className={`h-full rounded-full transition-[width] duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ level, pct }) {
  const r = 44, c = 2 * Math.PI * r;
  return (
    <div className="relative size-28 shrink-0" role="img" aria-label={`Level ${level}, ${Math.round(pct * 100)}% to next level`}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-line)" strokeWidth="6" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-gold)" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="font-display text-3xl font-bold leading-none">{level}</span>
        <span className="text-xs text-mute">Level</span>
      </div>
    </div>
  );
}
