import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface LoginPageProps {
  loading: boolean;
  errorMessage?: string;
  onSubmit: (input: {
    identifier: string;
    secret: string;
    client: "web";
  }) => void | Promise<void>;
}

export function LoginPage({ loading, errorMessage, onSubmit }: LoginPageProps) {
  const [identifier, setIdentifier] = useState("hybrid@example.com");
  const [secret, setSecret] = useState("demo-pass");

  return (
    <section className="login-screen grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-[430px] overflow-hidden border-[rgba(55,111,199,0.16)] shadow-[0_30px_80px_rgba(40,88,163,0.18)]">
        {/* Hero/Aside Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#327bff] to-[#6ec1ff] px-6 py-7 text-[#f7fbff]">
          {/* Background decorations */}
          <div className="absolute -right-4 -bottom-10 h-[120px] w-[120px] rotate-[18deg] rounded-[28px] bg-white/10" />
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at top right, rgba(255,255,255,0.28), transparent 36%)'
            }}
          />
          
          <div className="relative">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/80">
              Creator x Demand
            </p>
            <h1 className="text-[34px] font-normal leading-tight tracking-tight">
              登录创意喵
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[rgba(247,251,255,0.9)]">
              先完成 Web 登录，然后按小程序同样的任务链路完成浏览、投稿、发单和切换角色。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge className="h-[34px] rounded-full border border-white/15 bg-white/10 px-3 text-[13px] font-normal text-white backdrop-blur-[16px]">
                同一套 session
              </Badge>
              <Badge className="h-[34px] rounded-full border border-white/15 bg-white/10 px-3 text-[13px] font-normal text-white backdrop-blur-[16px]">
                创作者 / 需求方并行
              </Badge>
              <Badge className="h-[34px] rounded-full border border-white/15 bg-white/10 px-3 text-[13px] font-normal text-white backdrop-blur-[16px]">
                后台独立治理
              </Badge>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <CardContent className="p-6 bg-gradient-to-b from-white/95 to-[rgba(242,248,255,0.95)]">
          <div className="mb-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6882a3]">
              Demo Access
            </p>
            <h2 className="text-2xl font-normal tracking-tight text-[#183153]">
              进入 Web 版创意喵
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6882a3]">
              默认填入混合账号，登录后直接进入移动布局，并可切换创作者与需求方视图。
            </p>
          </div>

          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault();
            onSubmit({ identifier, secret, client: "web" });
          }}>
            <div className="space-y-2">
              <Label htmlFor="web-login-identifier" className="text-[13px] font-semibold text-[#6882a3]">
                账号
              </Label>
              <Input
                id="web-login-identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="h-[50px] rounded-2xl border-[rgba(77,128,206,0.18)] bg-[rgba(246,250,255,0.95)] px-4 text-[#183153] focus:border-[rgba(47,124,246,0.42)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(47,124,246,0.14)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="web-login-secret" className="text-[13px] font-semibold text-[#6882a3]">
                口令
              </Label>
              <Input
                id="web-login-secret"
                type="password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                className="h-[50px] rounded-2xl border-[rgba(77,128,206,0.18)] bg-[rgba(246,250,255,0.95)] px-4 text-[#183153] focus:border-[rgba(47,124,246,0.42)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(47,124,246,0.14)]"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-[46px] w-full rounded-full bg-gradient-to-br from-[#2f7cf6] to-[#1f64d1] px-5 text-white shadow-[0_14px_28px_rgba(47,124,246,0.24)] transition-all hover:-translate-y-px disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? "登录中..." : "进入创意喵"}
            </Button>
          </form>

          {errorMessage ? (
            <p className="mt-4 rounded-2xl bg-[rgba(255,232,236,0.95)] px-4 py-3 text-sm text-[#b73f55]">
              {errorMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
