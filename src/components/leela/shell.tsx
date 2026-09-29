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
        <div className="cosmic-veil" />
        <div className="wisdom-light" />
        <div className="nebula nebula-a" />
        <div className="nebula nebula-b" />
        <div className="nebula nebula-c" />
        <div className="nebula nebula-d" />
        <div className="nebula nebula-e" />
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
    <p className={large ? "lila-logo lila-logo-lg" : "lila-logo"}>
      <span className="lila-aura" aria-hidden />
      <span className="lila-word">LILA</span>
    </p>
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
