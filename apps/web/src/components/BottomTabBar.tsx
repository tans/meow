import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";

const creatorTabs = [
  { to: "/tasks", label: "悬赏大厅" },
  { to: "/workspace", label: "获奖作品" },
  { to: "/profile", label: "我的" },
];

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentTab = creatorTabs.find(tab => tab.to === location.pathname)?.to || "/tasks";

  return (
    <Tabs value={currentTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 gap-2 border-[rgba(84,137,214,0.14)] bg-white/90 p-2 shadow-[0_12px_30px_rgba(48,98,176,0.12)] backdrop-blur-[18px]">
        {creatorTabs.map((tab) => (
          <TabsTrigger
            key={tab.to}
            value={tab.to}
            onClick={() => navigate(tab.to)}
            className="rounded-[18px] py-3 text-sm font-bold text-[#6882a3] data-[state=active]:bg-gradient-to-b data-[state=active]:from-[#eff6ff] data-[state=active]:to-[#dceaff] data-[state=active]:text-[#1f64d1] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(47,124,246,0.08)]"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
