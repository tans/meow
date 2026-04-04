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

export function RoleSwitch({ roles, activeRole, onSwitch }: RoleSwitchProps) {
  const nextRole = roles.find((role) => role !== activeRole);
  if (!nextRole) {
    return null;
  }
  return (
    <Button
      variant="outline"
      className="h-11 rounded-full border-[rgba(55,111,199,0.16)] bg-white/80 px-4 text-[#1f64d1] text-sm hover:-translate-y-px hover:bg-white transition-transform"
      onClick={() => onSwitch(nextRole)}
    >
      {`切换到${roleLabel[nextRole]}`}
    </Button>
  );
}
