import { NavLink } from "react-router-dom";

const creatorTabs = [
  { to: "/tasks", label: "悬赏大厅" },
  { to: "/workspace", label: "获奖作品" },
  { to: "/profile", label: "我的" }
];

export function BottomTabBar() {
  return (
    <nav className="bottom-tab-bar" aria-label="Creator tabs">
      {creatorTabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            isActive ? "bottom-tab bottom-tab--active" : "bottom-tab"
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
