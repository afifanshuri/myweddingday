"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import "@/css/main-button.css";

type ButtonAppearance = {
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "danger"
    | "link"
    | "choice"
    | "custom";
  size?: "regular" | "small" | "icon" | "none";
};

type MainButtonProps = ButtonAppearance & (
  | (ComponentProps<"button"> & { href?: undefined })
  | (Omit<ComponentProps<typeof Link>, "href"> & { href: string })
);

export default function MainButton(props: MainButtonProps) {
  const { variant = "primary", size = "regular", className = "", ...elementProps } = props;
  const classes = `main-button main-button--${variant} main-button--size-${size} ${className}`;

  if (elementProps.href !== undefined) {
    return <Link {...elementProps} className={classes} />;
  }

  const { type = "button", ...buttonProps } = elementProps;
  return <button {...buttonProps} type={type} className={classes} />;
}
