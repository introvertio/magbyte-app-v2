"use client";
import React from "react";
import { twMerge as tw } from "tailwind-merge";
import { styles } from "../../styles/constants";

export default function Button({
  children,
  onClick,
  disabled,
  className,
  style,
  hidden,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  hidden?: boolean;
}) {
  return (
    <button
      hidden={hidden}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={tw(styles.defaultButton, className)}
    >
      {children}
    </button>
  );
}
