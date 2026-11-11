import React from 'react';
import { formatRupiah, parseRupiah } from '../utils/currencyHelpers';

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "Rp 0",
  className = "",
  disabled = false,
  autoFocus = false,
  withPrefix = true,
  withSuffix = false,
  ...props
}) {
  const handleChange = (e) => {
    const rawInput = e.target.value;
    const numericVal = parseRupiah(rawInput);
    // Mengirim angka mentah (integer) ke state induk
    onChange(numericVal);
  };

  const displayValue = (value !== null && value !== undefined && value !== '' && value !== 0)
    ? formatRupiah(value, withPrefix, withSuffix)
    : '';

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      autoFocus={autoFocus}
      {...props}
    />
  );
}