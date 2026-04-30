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

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  children,
  style,
  className,
  ...rest
}: Props) {
  const classes = [
    'ui-button',
    `ui-button--${size}`,
    `ui-button--${variant}`,
    fullWidth ? 'ui-button--full' : '',
    disabled ? 'is-disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button disabled={disabled} className={classes} style={style} {...rest}>
      {children}
    </button>
  );
}
