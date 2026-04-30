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

const PADDING_CLASS: Record<Padding, string> = {
  sm:   'ui-card--p-sm',
  md:   'ui-card--p-md',
  base: '', // default su .ui-card
  lg:   'ui-card--p-lg',
};

const RADIUS_CLASS: Record<Radius, string> = {
  sm: 'ui-card--r-sm',
  md: '', // default su .ui-card
  lg: 'ui-card--r-lg',
};

export default function Card({
  children,
  padding = 'base',
  radius = 'md',
  shadow = false,
  background,
  borderColor,
  className,
  style,
}: Props) {
  // Se background/borderColor sono override (raro), li applichiamo
  // come inline style legittimo (sovrascrive default --color-bg/--color-border).
  // Eccezione documentata: pattern API legacy, override puntuale.
  const overrideStyle: CSSProperties | undefined =
    (background || borderColor || style)
      ? {
          ...(background ? { background } : {}),
          ...(borderColor ? { borderColor } : {}),
          ...(style ?? {}),
        }
      : undefined;

  const classes = [
    'ui-card',
    PADDING_CLASS[padding],
    RADIUS_CLASS[radius],
    shadow ? 'ui-card--shadow' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} style={overrideStyle}>
      {children}
    </div>
  );
}
