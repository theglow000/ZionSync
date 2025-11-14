"use client";

import React from "react";

export function Button({
  className = "",
  variant = "default",
  size = "default",
  children,
  ...props
}) {
  // Basic variant styles
  const variantClasses = {
    default: "bg-purple-700 text-white hover:bg-purple-800",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    ghost: "hover:bg-gray-100",
    link: "text-purple-700 underline hover:text-purple-800",
  };

  // Basic size styles
  const sizeClasses = {
    default: "px-4 py-2",
    sm: "px-3 py-1 text-sm",
    lg: "px-6 py-3",
    icon: "p-2",
  };

  const baseClass =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none disabled:opacity-50";

  const classes = [
    baseClass,
    variantClasses[variant] || variantClasses.default,
    sizeClasses[size] || sizeClasses.default,
    className,
  ].join(" ");

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export const buttonVariants = {
  default: "bg-purple-700 text-white hover:bg-purple-800",
  destructive: "bg-red-500 text-white hover:bg-red-600",
  outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  ghost: "hover:bg-gray-100",
  link: "text-purple-700 underline hover:text-purple-800",
};
