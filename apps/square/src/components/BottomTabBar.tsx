import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const creatorTabs = [
  { to: "/tasks", label: "悬赏大厅", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { to: "/workspace", label: "获奖作品", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { to: "/profile", label: "我的", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
];

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = creatorTabs.find(tab => tab.to === location.pathname)?.to || "/tasks";

  return (
    <Tabs value={currentTab} className="w-full">
      <TabsList className={cn(
        "grid w-full grid-cols-3 gap-0 h-16",
        "bg-card/80 backdrop-blur-lg",
        "border-t border-border/60",
        "relative before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-16 before:h-0.5 before:bg-primary before:rounded-full"
      )}>
        {creatorTabs.map((tab, index) => (
          <TabsTrigger
            key={tab.to}
            value={tab.to}
            onClick={() => navigate(tab.to)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2.5 px-1",
              "text-xs font-medium transition-all duration-300",
              "data-[state=active]:text-primary data-[state=active]:font-semibold",
              "data-[state=active]:scale-105",
              "text-muted-foreground hover:text-foreground",
              currentTab === tab.to && "relative"
            )}
          >
            <svg
              className={cn(
                "w-5 h-5 transition-transform duration-300",
                currentTab === tab.to && "scale-110"
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={tab.icon} />
            </svg>
            <span>{tab.label}</span>
            {currentTab === tab.to && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
