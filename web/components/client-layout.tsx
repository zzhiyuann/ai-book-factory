"use client";

import { PinGate } from "./pin-gate";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <PinGate>{children}</PinGate>;
}
