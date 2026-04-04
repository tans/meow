import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

interface TaskCardProps {
  title: string;
  eyebrow: string;
  meta: string;
  detail: string;
  footer?: ReactNode;
}

export function TaskCard({ title, eyebrow, meta, detail, footer }: TaskCardProps) {
  return (
    <Card className="relative overflow-hidden border-[rgba(84,137,214,0.12)] bg-white/95 shadow-[0_12px_30px_rgba(48,98,176,0.12)]">
      {/* Gradient header background */}
      <div className="absolute inset-x-0 top-0 h-[76px] bg-gradient-to-br from-[rgba(207,226,255,0.98)] to-[rgba(164,203,255,0.98)]" />
      
      <CardHeader className="relative pt-5">
        <Badge className="absolute top-4 left-5 h-8 rounded-full bg-white/90 px-3 text-xs font-bold uppercase tracking-wider text-[#4871ab]">
          {eyebrow}
        </Badge>
      </CardHeader>
      
      <CardContent className="relative space-y-2 pt-2">
        <h3 className="text-[22px] font-normal leading-tight tracking-tight text-[#183153]">
          {title}
        </h3>
        <p className="text-sm font-bold text-[#2f7cf6]">{meta}</p>
        <p className="text-sm leading-relaxed text-[#6882a3]">{detail}</p>
      </CardContent>
      
      {footer ? (
        <CardFooter className="border-t border-[rgba(84,137,214,0.1)] pt-4">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}
