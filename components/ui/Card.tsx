import { CSSProperties, ReactNode } from 'react';

type Padding = 'sm' | 'md' | 'base' | 'lg';
type Radius = 'sm' | 'md' | 'lg';

interface Props {
  children: ReactNode;
  padding?: Padding;
  radius?: Radius;
  shadow?: boolean;
  background?: string;
  borderColor?: string;
  className?: string;
  style?: CSSProperties;
}

const PADDINGS: Record<Padding, string> = {
  sm: 'var(--space-sm)',
  md: 'var(--space-md)',
  base: 'var(--space-base)',
  lg: 'var(--space-lg)',
};

const RADII: Record<Radius, string> = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
};

export default function Card({
  children,
  padding = 'base',
  radius = 'md',
  shadow = false,
  background = 'var(--color-bg)',
  borderColor = 'var(--color-border)',
  className,
  style,
}: Props) {
  return (
    <div
      className={className}
      style={{
        padding: PADDINGS[padding],
        borderRadius: RADII[radius],
        border: `1px solid ${borderColor}`,
        background,
        boxShadow: shadow ? '0 2px 8px rgba(0,0,0,0.06)' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
