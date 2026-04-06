import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  subtitle: string;
  userName?: string;
}

export function Header({ title, subtitle, userName }: HeaderProps) {
  return (
    <Card className="border-[rgba(55,111,199,0.16)] bg-white/90 shadow-[0_12px_30px_rgba(48,98,176,0.12)]">
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6882a3]">
            Merchant Console
          </p>
          <h2 className="text-2xl font-normal tracking-tight text-[#183153]">
            {title}
          </h2>
          <p className="mt-2 text-sm text-[#6882a3]">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          {userName && (
            <Badge
              variant="secondary"
              className="h-[34px] rounded-full bg-[#fff0eb] px-3 text-xs font-bold text-[#ff6b35]"
            >
              {userName}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
