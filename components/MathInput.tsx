import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface MathInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string; // To merge classes
  placeholder?: string;
  max?: number;
}

export function MathInput({
  value,
  onChange,
  className,
  placeholder,
}: MathInputProps) {
  // Local state to allow typing "10+5" before it becomes a number
  const [inputValue, setInputValue] = useState(
    value === 0 ? "" : value.toString(),
  );

  // Sync with parent value updates (e.g. scanning results)
  useEffect(() => {
    // Only update if the parent value is different effectively (to avoid cursor jumps if we were typing, but mostly this is for external updates)
    // We'll trust that if value changes externally, we show it.
    // But we don't want to overwrite user typing "10+" with "10".
    // Simple check: if value matches what we think it is (parsed), don't change.
    // Actually, just syncing on blur is safer, but for "live" assignment updates we need this.
    // Let's just sync if document.activeElement is NOT this input.
    if (document.activeElement !== inputRef.current) {
      setInputValue(value === 0 ? "" : value.toString());
    }
  }, [value]);

  const inputRef = useRef<HTMLInputElement>(null);

  const evaluateExpression = (expression: string): number => {
    try {
      // safe simple evaluation for + and - and * and /
      // We will only support + and - for now to be safe and simple for bills, maybe * for quantity.
      // actually "10+20" is the main use case.
      // Let's sanitize: allowed chars: 0-9 . + - * / ( )
      const sanitized = expression.replace(/[^0-9.\+\-\*\/\(\)\s]/g, "");
      if (!sanitized) return 0;

      // Function constructor is safer than eval, but still parsed.
      // Given the sanitization, it's relatively safe.
      // eslint-disable-next-line
      const result = new Function(`return ${sanitized}`)();

      const numInfo = parseFloat(result);
      return isNaN(numInfo) || !isFinite(numInfo) ? 0 : numInfo;
    } catch (e) {
      console.warn("Invalid math expression", e);
      return 0;
    }
  };

  const handleBlur = () => {
    const result = evaluateExpression(inputValue);
    const rounded = Math.round(result * 100) / 100; // Keep 2 decimals
    onChange(rounded);
    setInputValue(rounded === 0 ? "" : rounded.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal" // Mobile keyboard with numbers + extras
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={cn(
        "block w-full bg-transparent focus:outline-none transition-colors",
        className,
      )}
      placeholder={placeholder}
    />
  );
}
