import type { WebRole } from "../lib/session.js";

interface RoleSwitchProps {
  roles: WebRole[];
  activeRole: WebRole;
  onSwitch: (role: WebRole) => void;
}

const roleLabel: Record<WebRole, string> = {
  creator: "创作者",
  merchant: "需求方"
};

export function RoleSwitch({
  roles,
  activeRole,
  onSwitch
}: RoleSwitchProps) {
  const nextRole = roles.find((role) => role !== activeRole);

  if (!nextRole) {
    return null;
  }

  return (
    <button
      className="secondary-button"
      type="button"
      onClick={() => onSwitch(nextRole)}
    >
      {`切换到${roleLabel[nextRole]}`}
    </button>
  );
}
