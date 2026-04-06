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
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-sm animate-scale-in opacity-0 border-border/60 bg-card/95 backdrop-blur-xl shadow-xl">
        <CardHeader className="space-y-2 pb-6 pt-6">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/8 text-primary border-primary/20 text-xs font-semibold">
              Creator × Demand
            </Badge>
          </div>
          <CardTitle className="font-display text-2xl font-bold tracking-tight text-foreground">
            登录创意喵
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed text-muted-foreground">
            先完成 Web 登录，然后按小程序同样的任务链路完成浏览、投稿、发单和切换角色。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-2">
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault();
            onSubmit({ identifier, secret, client: "web" });
          }}>
            <div className="space-y-1.5">
              <Label htmlFor="web-login-identifier" className="text-sm font-medium text-foreground/80">
                账号
              </Label>
              <Input
                id="web-login-identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="h-11 border-border/60 bg-background/50 focus:bg-background rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="web-login-secret" className="text-sm font-medium text-foreground/80">
                口令
              </Label>
              <Input
                id="web-login-secret"
                type="password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                className="h-11 border-border/60 bg-background/50 focus:bg-background rounded-lg"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-primary hover:bg-primary/90 font-semibold rounded-lg shadow-md shadow-primary/20 transition-all duration-200 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  登录中...
                </span>
              ) : "进入创意喵"}
            </Button>
          </form>

          {errorMessage ? (
            <p className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive font-medium animate-fade-in">
              {errorMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
