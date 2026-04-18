import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
  style?: React.CSSProperties;
}

const SIZES: Record<Size, { padding: string; fontSize: string }> = {
  sm: { padding: '8px 14px', fontSize: 'var(--text-sm)' },
  md: { padding: '10px 18px', fontSize: 'var(--text-base)' },
  lg: { padding: '14px 20px', fontSize: 'var(--text-md)' },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  children,
  style,
  ...rest
}: Props) {
  const dims = SIZES[size];

  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? {
          background: disabled ? '#e0e0e0' : 'var(--color-cta)',
          color: disabled ? '#999' : '#fff',
          border: 'none',
        }
      : variant === 'secondary'
      ? {
          background: '#fff',
          color: 'var(--color-primary)',
          border: '1.5px solid var(--color-primary)',
        }
      : {
          background: 'transparent',
          color: 'var(--color-primary)',
          border: 'none',
        };

  return (
    <button
      disabled={disabled}
      style={{
        ...dims,
        ...variantStyle,
        minHeight: 'var(--touch-target)',
        borderRadius: 'var(--radius-md)',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.15s',
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
