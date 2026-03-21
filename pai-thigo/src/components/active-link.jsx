"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function normalizePath(value) {
  if (!value || value === "/") {
    return "/";
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function isActivePath(pathname, href, exact) {
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(href);

  if (exact || targetPath === "/") {
    return currentPath === targetPath;
  }

  return (
    currentPath === targetPath ||
    currentPath.startsWith(`${targetPath}/`) ||
    currentPath.startsWith(`${targetPath}?`)
  );
}

export function ActiveLink({
  href,
  exact = false,
  className = "",
  activeClassName = "",
  inactiveClassName = "",
  children,
  ...props
}) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href, exact);
  const resolvedClassName = [
    className,
    isActive ? activeClassName : inactiveClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={resolvedClassName}
      {...props}
    >
      {children}
    </Link>
  );
}
