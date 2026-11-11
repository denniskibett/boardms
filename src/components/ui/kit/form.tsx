'use client';

/**
 * Controlled TailAdmin form fields for slide-over forms.
 * (The legacy components/form/input/InputField ignores `value`, so don't use it for controlled forms.)
 *
 *   <FormGrid>
 *     <Field label="Title" required error={errors.title}>
 *       <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
 *     </Field>
 *     <Field label="Type" span={1}>
 *       <SelectInput value={type} onChange={…} options={[{ value: 'a', label: 'A' }]} placeholder="Choose…" />
 *     </Field>
 *   </FormGrid>
 */

import React, { useId } from 'react';

const base =
  'w-full rounded-lg border bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:disabled:bg-gray-800';
const ok = 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800';
const bad = 'border-error-500 focus:border-error-500 focus:ring-error-500/10 dark:border-error-500';

const FieldCtx = React.createContext<{ id?: string; invalid?: boolean }>({});

export function FormGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 }) {
  return <div className={`grid grid-cols-1 gap-5 ${cols === 2 ? 'sm:grid-cols-2' : ''}`}>{children}</div>;
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-b border-gray-100 pb-6 last:border-0 last:pb-0 dark:border-gray-800">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h3>
        {description && <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  span = 2,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  /** Columns to span inside a 2-column FormGrid. */
  span?: 1 | 2;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <FieldCtx.Provider value={{ id, invalid: !!error }}>
      <div className={span === 2 ? 'sm:col-span-2' : ''}>
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
          {required && <span className="ml-0.5 text-error-500">*</span>}
        </label>
        {children}
        {error ? (
          <p className="mt-1.5 text-theme-xs text-error-500">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">{hint}</p>
        ) : null}
      </div>
    </FieldCtx.Provider>
  );
}

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = '', ...props }, ref) {
    const { id, invalid } = React.useContext(FieldCtx);
    return <input ref={ref} id={props.id ?? id} aria-invalid={invalid} className={`h-11 py-2.5 ${base} ${invalid ? bad : ok} ${className}`} {...props} />;
  },
);

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className = '', rows = 4, ...props }, ref) {
    const { id, invalid } = React.useContext(FieldCtx);
    return <textarea ref={ref} rows={rows} id={props.id ?? id} aria-invalid={invalid} className={`py-2.5 ${base} ${invalid ? bad : ok} ${className}`} {...props} />;
  },
);

export interface Option {
  value: string | number;
  label: string;
}

export const SelectInput = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { options: Option[]; placeholder?: string }
>(function SelectInput({ className = '', options, placeholder, ...props }, ref) {
  const { id, invalid } = React.useContext(FieldCtx);
  return (
    <select ref={ref} id={props.id ?? id} aria-invalid={invalid} className={`h-11 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 fill=%22none%22 stroke=%22%2398a2b3%22 stroke-width=%221.5%22><path d=%22M5 8l5 5 5-5%22/></svg>')] bg-[right_0.75rem_center] bg-no-repeat pr-10 ${base} ${invalid ? bad : ok} ${className}`} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
});

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900"
      />
      <span>
        <span className="block text-sm text-gray-700 dark:text-gray-300">{label}</span>
        {description && <span className="block text-theme-xs text-gray-500 dark:text-gray-400">{description}</span>}
      </span>
    </label>
  );
}

/** Primary / outline / danger buttons matching TailAdmin. */
export function Btn({
  variant = 'primary',
  size = 'md',
  loading,
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
}) {
  const v = {
    primary: 'bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300',
    outline:
      'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.03]',
    danger: 'bg-error-500 text-white shadow-theme-xs hover:bg-error-600 disabled:bg-error-300',
    ghost: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5',
  }[variant];
  const s = size === 'sm' ? 'h-9 px-3.5 text-sm' : 'h-11 px-5 text-sm';
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed ${s} ${v} ${className}`}
      disabled={loading || props.disabled}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}
