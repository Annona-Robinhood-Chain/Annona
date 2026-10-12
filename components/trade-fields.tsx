'use client';
import { Appear, Field } from './primitives';
import { Tabs } from './tabs';

// Pilihan mode: "tabs" = tab pil dengan indikator geser (Mint/Redeem, Deposit/Withdraw); "seg" = deretan chip kecil (slippage).
// Tetap grup tombol dengan aria-pressed (bukan tab ARIA) karena tidak ada tabpanel terpisah.
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  variant = 'tabs',
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  label: string;
  variant?: 'tabs' | 'seg';
}) {
  if (variant === 'seg') {
    return (
      <div role="group" aria-label={label} className="seg">
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={o === value} className={o === value ? 'on' : undefined} onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
    );
  }
  return <Tabs value={value} options={options} onChange={onChange} label={label} capitalize />;
}

// Kotak form bergaya Annona (.form). Judul tetap ada untuk pembaca layar.
export function FormPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Appear as="section" className="form">
      <h2 className="sr-only">{title}</h2>
      {children}
    </Appear>
  );
}

// Kolom jumlah (.field): label, input mono besar, chip satuan di kanan. Fokus menyalakan border oranye.
export function AmountField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} asset={unit}>
      <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0.00" />
    </Field>
  );
}
export function Radio({
  name,
  value,
  checked,
  onChange,
  title,
  hint,
  disabled = false,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-2.5 py-2.5 text-[.92rem] ${disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 accent-leaf"
      />
      <span>
        {title}
        <small className="block text-bark">{hint}</small>
      </span>
    </label>
  );
}
export const note = 'text-[.86rem] text-bark';
