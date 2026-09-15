import { IconAlertTriangle, IconBell, IconClock, IconDrone, IconWrench } from "../../components/icons.jsx";

// Maps a notification's `type` (backend/app/services/notification_service.py
// TYPE_* constants) to a display icon + color — presentation only, the
// trigger/business logic that decides when each type fires is untouched.
const META = {
  high_risk_prediction: { Icon: IconAlertTriangle, color: "var(--dc-danger)", soft: "var(--dc-danger-soft)" },
  status_change: { Icon: IconDrone, color: "var(--dc-accent)", soft: "var(--dc-accent-soft)" },
  maintenance_due: { Icon: IconClock, color: "var(--dc-warning)", soft: "var(--dc-warning-soft)" },
  maintenance_overdue: { Icon: IconWrench, color: "var(--dc-danger)", soft: "var(--dc-danger-soft)" },
};

const DEFAULT_META = { Icon: IconBell, color: "var(--dc-text-muted)", soft: "var(--dc-neutral-soft)" };

export function notificationIconFor(type) {
  return META[type] || DEFAULT_META;
}
