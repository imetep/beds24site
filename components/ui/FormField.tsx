import { InputHTMLAttributes, ReactNode, useId } from 'react';

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

export default function FormField(props: Props) {
  const { label, error, hint, as = 'input' } = props;
  const autoId = useId();
  const id = props.id ?? autoId;
  const hasError = !!error;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = errorId ?? hintId;
  const fieldClass = `ui-field-input${hasError ? ' is-error' : ''}`;

  const { label: _l, error: _e, hint: _h, as: _a, ...nativeProps } = props as {
    [k: string]: unknown;
  };

  const shared = {
    ...nativeProps,
    id,
    'aria-invalid': hasError || undefined,
    'aria-describedby': describedBy,
  };

  return (
    <div className="ui-field-wrapper">
      {label && (
        <label htmlFor={id} className="ui-field-label">
          {label}
        </label>
      )}
      {as === 'input' && (
        <input
          {...(shared as InputHTMLAttributes<HTMLInputElement>)}
          className={fieldClass}
        />
      )}
      {as === 'textarea' && (
        <textarea
          {...(shared as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          className={`${fieldClass} ui-field-textarea`}
        />
      )}
      {as === 'select' && (
        <select
          {...(shared as React.SelectHTMLAttributes<HTMLSelectElement>)}
          className={fieldClass}
        />
      )}
      {!error && hint && (
        <p id={hintId} className="ui-field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="ui-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
