import { Button } from "@/components/ui/button";
import type { WebRole } from "../lib/session.js";

interface RoleSwitchProps {
  roles: WebRole[];
  activeRole: WebRole;
  onSwitch: (role: WebRole) => void;
}

const roleLabel: Record<WebRole, string> = {
  creator: "创作者",
  merchant: "需求方",
};

const roleColors: Record<WebRole, { bg: string; text: string; border: string }> = {
  creator: { bg: "bg-primary/8", text: "text-primary", border: "border-primary/20" },
  merchant: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/30" },
};

export function RoleSwitch({ roles, activeRole, onSwitch }: RoleSwitchProps) {
  const nextRole = roles.find((role) => role !== activeRole);
  if (!nextRole) {
    return null;
  }

  const colors = roleColors[activeRole];

  return (
    <Button
      variant="outline"
      size="sm"
      className={`
        h-8 rounded-full px-4 text-xs font-semibold
        border ${colors.border} ${colors.bg} ${colors.text}
        hover:${colors.bg} hover:opacity-90
        transition-all duration-200
      `}
      onClick={() => onSwitch(nextRole)}
    >
      <span className="mr-1.5">⇄</span>
      {`切换${roleLabel[nextRole]}`}
    </Button>
  );
}
