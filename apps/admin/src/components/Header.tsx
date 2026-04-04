import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <Card className="border-[rgba(55,111,199,0.16)] bg-white/90 shadow-[0_12px_30px_rgba(48,98,176,0.12)]">
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6882a3]">
            Operator Console
          </p>
          <h2 className="text-2xl font-normal tracking-tight text-[#183153]">
            {title}
          </h2>
          <p className="mt-2 text-sm text-[#6882a3]">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Badge 
            variant="outline" 
            className="h-[34px] rounded-full border-[rgba(55,111,199,0.16)] bg-white/80 px-3 text-xs font-bold text-[#6882a3]"
          >
            轻审核开启
          </Badge>
          <Badge 
            variant="secondary"
            className="h-[34px] rounded-full bg-[#dbe9ff] px-3 text-xs font-bold text-[#1f64d1]"
          >
            账本模拟模式
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
