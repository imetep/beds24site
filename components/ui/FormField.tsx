import { InputHTMLAttributes, ReactNode } from 'react';

interface BaseProps {
  label?: string;
  error?: string;
  hint?: string;
}

interface InputProps extends BaseProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'style'> {
  as?: 'input';
  style?: React.CSSProperties;
}

interface TextareaProps extends BaseProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  as: 'textarea';
  style?: React.CSSProperties;
}

interface SelectProps extends BaseProps, Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'style'> {
  as: 'select';
  style?: React.CSSProperties;
  children: ReactNode;
}

type Props = InputProps | TextareaProps | SelectProps;

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--color-text-label)',
  marginBottom: 'var(--space-xs)',
};

const fieldStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '10px 14px',
  minHeight: 'var(--touch-target)',
  fontSize: 'var(--text-base)',
  border: `1.5px solid ${hasError ? '#dc2626' : 'var(--color-border)'}`,
  borderRadius: 'var(--radius-sm)',
  outline: 'none',
  boxSizing: 'border-box',
  color: 'var(--color-text)',
  background: '#fff',
});

const hintStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  margin: '4px 0 0',
};

const errorStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: '#dc2626',
  margin: '4px 0 0',
};

export default function FormField(props: Props) {
  const { label, error, hint, style, as = 'input' } = props;
  const hasError = !!error;
  const fStyle = { ...fieldStyle(hasError), ...style };

  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      {label && <label style={labelStyle}>{label}</label>}
      {as === 'input' && (
        <input {...(props as InputProps)} style={fStyle} />
      )}
      {as === 'textarea' && (
        <textarea {...(props as TextareaProps)} style={{ ...fStyle, minHeight: 80, resize: 'vertical' }} />
      )}
      {as === 'select' && (
        <select {...(props as SelectProps)} style={fStyle}>
          {(props as SelectProps).children}
        </select>
      )}
      {!error && hint && <p style={hintStyle}>{hint}</p>}
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}
