import type { CSSProperties, ReactNode } from "react";
import { SoundToggle } from "@/components/leela/sound-toggle";

const STARS = Array.from({ length: 48 }, (_, index) => {
  const left = (index * 37 + 11) % 100;
  const top = (index * 53 + 7) % 100;
  const large = index % 7 === 0;
  return {
    index,
    style: {
      left: `${left}%`,
      top: `${top}%`,
      width: large ? 3 : 2,
      height: large ? 3 : 2,
      animationDelay: `${(index % 8) * 0.45}s`,
    } satisfies CSSProperties,
  };
});

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-bg text-fg">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="nebula nebula-a" />
        <div className="nebula nebula-b" />
        {STARS.map((star) => (
          <span key={star.index} className="star" style={star.style} />
        ))}
      </div>
      <div className="relative pb-20">{children}</div>
      <SoundToggle />
    </div>
  );
}

export function LilaLogo({ large = false }: { large?: boolean }) {
  return (
    <div className={large ? "lila-logo lila-logo-lg" : "lila-logo"}>
      <span className="lila-aura" aria-hidden />
      <svg className="lila-figure" viewBox="0 0 80 150" aria-hidden>
        <path
          fill="currentColor"
          d="M40 10c8 0 13 6 13 13s-5 12-13 12-13-5-13-12 5-13 13-13zm-18 30c2 8 8 14 18 15 10-1 16-7 18-15 7 2 14 8 16 16-6 5-14 6-20 4 2 8 3 16 2 26 8 2 16 8 18 16-2 10-14 16-34 16s-32-6-34-16c2-8 10-14 18-16-1-10 0-18 2-26-6 2-14 1-20-4 2-8 9-14 16-16z"
        />
      </svg>
      <p className="lila-word">LILA</p>
    </div>
  );
}

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M16 4 L28 16 L16 28 L4 16 Z" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="16" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function Gate({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden>
      <path d="M28 132 V58 A72 72 0 0 1 172 58 V132" fill="none" stroke="currentColor" strokeWidth="0.7" />
      <path d="M46 132 V66 A54 54 0 0 1 154 66 V132" fill="none" stroke="currentColor" strokeWidth="0.4" />
      <circle cx="100" cy="58" r="46" fill="none" stroke="currentColor" strokeWidth="0.25" />
      <path d="M100 16 L114 36 L100 56 L86 36 Z" fill="none" stroke="currentColor" strokeWidth="0.7" />
      <circle cx="100" cy="36" r="2" fill="currentColor" />
      <path d="M18 96 L28 86 L18 76 L8 86 Z" fill="none" stroke="currentColor" strokeWidth="0.45" />
      <path d="M182 96 L192 86 L182 76 L172 86 Z" fill="none" stroke="currentColor" strokeWidth="0.45" />
    </svg>
  );
}
