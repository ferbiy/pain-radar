"use client";

import { usePathname } from "next/navigation";
import { MainNav } from "./main-nav";

export function ConditionalNav() {
  const pathname = usePathname();

  // Hide navigation on marketing page
  if (pathname === "/marketing") {
    return null;
  }

  return <MainNav />;
}
