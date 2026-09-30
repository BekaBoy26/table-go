import React from "react";
import { cn } from "@/lib/utils";

const statuses = {
  confirmed: { label: "Confirmed", ok: true },
  pending: { label: "Pending", ok: true },
  completed: { label: "Completed", ok: true },
  cancelled: { label: "Cancelled", ok: false },
  available: { label: "Tables available today", ok: true },
  booked: { label: "Fully booked today", ok: false },
};

type Props = {
  type: keyof typeof statuses;
  pill?: boolean;
};

const Status = ({ type, pill }: Props) => {
  const { label, ok } = statuses[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        ok ? "text-success" : "text-destructive",
        pill && "rounded-full bg-current/10 px-2.5 py-1",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

export default Status;
