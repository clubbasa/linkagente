"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import type { AnalyticsEventKind } from "@/lib/types";
import { logClickEvent } from "./actions";

interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  agentId: string;
  kind: Exclude<AnalyticsEventKind, "profile_view" | "lead_submitted">;
  platform?: string;
  children: ReactNode;
}

// Envuelve un <a> normal y registra un evento de analítica al hacer click,
// sin interferir con la navegación (tel:, mailto:, wa.me, descarga de vCard).
export function TrackedLink({
  agentId,
  kind,
  platform,
  children,
  onClick,
  ...rest
}: TrackedLinkProps) {
  return (
    <a
      {...rest}
      onClick={(event) => {
        logClickEvent(agentId, kind, platform).catch(() => {});
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
