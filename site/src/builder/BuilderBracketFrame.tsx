import type { ReactNode } from 'react';

export type BuilderBracketTone = 'default' | 'active' | 'disabled' | 'error';

export function BuilderBracketFrame({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: BuilderBracketTone;
}) {
  return (
    <div className="builder-bracket-frame" data-tone={tone}>
      <span
        className="builder-bracket-corner"
        data-position="top-left"
        aria-hidden
      />
      <span
        className="builder-bracket-corner"
        data-position="top-right"
        aria-hidden
      />
      <span
        className="builder-bracket-corner"
        data-position="bottom-right"
        aria-hidden
      />
      <span
        className="builder-bracket-corner"
        data-position="bottom-left"
        aria-hidden
      />
      {children}
    </div>
  );
}
