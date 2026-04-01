import React, { useEffect, useRef, useState } from "react";
import { twMerge as tw } from "tailwind-merge";
import { styles } from "../../styles/constants";
import { colors } from "../../styles/constants";

export default function Input({
  containerClassName,
  autoFocus,
  label,
  maxLength,
  dontShowMaxLengthDisplay,
  lengthDisplayColor,
  labelClassName,
  inputClassName,
  placeholder,
  value,
  onChange,
  disabled,
  type,
  style,
  isValid,
  validationMessage,
}: {
  containerClassName?: string;
  autoFocus?: boolean;
  label?: string;
  maxLength?: number;
  dontShowMaxLengthDisplay?: boolean;
  lengthDisplayColor?: string;
  labelClassName?: string;
  inputClassName?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  type?: string;
  style?: React.CSSProperties;
  isValid?: boolean;
  validationMessage?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shake, setShake] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  // Handler to trigger shake if maxLength is reached and user tries to type more
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (maxLength && e.target.value.length > maxLength) {
      setShake(true);
      // Optionally, you can play a sound or give other feedback
      return;
    }
    setHasChanged(true);
    onChange(e);
  };

  // Remove shake class after animation
  useEffect(() => {
    if (shake) {
      const timeout = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [shake]);

  // Handler for keydown to catch attempts to type past maxLength
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      maxLength &&
      typeof value === "string" &&
      value.length >= maxLength &&
      // Allow navigation, backspace, delete, etc.
      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(
        e.key
      ) &&
      // Only block printable characters
      e.key.length === 1
    ) {
      setShake(true);
      e.preventDefault();
    }
  };

  return (
    <div className={tw(containerClassName, `relative`)}>
      {/* Inline shake animation style */}
      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
        .shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
      {label && (
        <label
          htmlFor={label}
          className={tw(styles.defaultLabel, labelClassName)}
        >
          {label}
        </label>
      )}

      <input
        style={style}
        disabled={disabled}
        ref={inputRef}
        autoFocus={autoFocus}
        maxLength={maxLength}
        type={type}
        id={label}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={tw(
          styles.defaultInput,
          inputClassName,
          shake && "shake",
          hasChanged &&
            isValid !== undefined &&
            ((isValid && "border-green-500") || (!isValid && "border-red-500"))
        )}
      />
      {typeof value === "string" &&
        value.length > 0 &&
        maxLength &&
        !dontShowMaxLengthDisplay && (
          <div className="absolute right-0 top-0 flex items-center justify-center">
            <div
              className=" right-0 top-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-100 relative"
              style={{
                background: `conic-gradient(${
                  lengthDisplayColor ?? colors.primary
                } ${(value.length / maxLength) * 100}%, #e5e7eb 0%)`,
              }}
              aria-label={`Media files used: ${value.length} of ${maxLength}`}
            >
              <div className="absolute size-3 rounded-full bg-white dark:bg-black left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        )}
      {validationMessage && isValid !== undefined && !isValid && (
        <p className="text-red-500 text-xs mt-1">{validationMessage}</p>
      )}
      {validationMessage && isValid !== undefined && isValid && (
        <p className="text-green-500 text-xs mt-1">{validationMessage}</p>
      )}
    </div>
  );
}
