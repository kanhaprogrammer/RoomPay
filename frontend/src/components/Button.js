import React from "react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  block = false,
  className = "",
  disabled,
  ...rest
}) {
  const classes = [
    "btn",
    `btn-${variant}`,
    size === "sm" ? "btn-sm" : "",
    block ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading && <span className={`spinner ${variant === "secondary" ? "spinner-dark" : ""}`} />}
      {loading ? loadingText || children : children}
    </button>
  );
}
