import { CircleAlert, CircleCheck, Lightbulb } from "lucide-react";
import type {
  TechnicalEntryStatus,
  TechnicalEntryType,
} from "./types/technical-entry";

export const technicalEntryTypePresentation = {
  ISSUE: {
    label: "Issue",
    description: "A problem or unexpected behavior to investigate.",
    icon: CircleAlert,
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  LEARNING: {
    label: "Learning",
    description: "A useful concept, discovery, or lesson learned.",
    icon: Lightbulb,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
} as const;

export const technicalEntryStatusPresentation = {
  OPEN: {
    label: "Open",
    icon: CircleAlert,
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  RESOLVED: {
    label: "Resolved",
    icon: CircleCheck,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
} as const;

export function presentTechnicalEntryType(type: TechnicalEntryType) {
  return technicalEntryTypePresentation[type];
}

export function presentTechnicalEntryStatus(status: TechnicalEntryStatus) {
  return technicalEntryStatusPresentation[status];
}
