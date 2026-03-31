import { useState } from "react";

interface LoginPageProps {
  loading: boolean;
  errorMessage?: string;
  onSubmit: (input: {
    identifier: string;
    secret: string;
    client: "web";
  }) => void | Promise<void>;
}

export function LoginPage({
  loading,
  errorMessage,
  onSubmit
}: LoginPageProps) {
  const [identifier, setIdentifier] = useState("hybrid@example.com");
  const [secret, setSecret] = useState("demo-pass");

  return (
    <section className="login-screen">
      <div className="login-panel">
        <div className="login-aside">
          <p className="login-kicker">Creator x Merchant</p>
          <h1 className="login-title">登录创意喵</h1>
          <p className="login-lead">
            先完成 Web 登录，然后按小程序同样的任务链路完成浏览、投稿、发单和切换角色。
          </p>
          <div className="login-badges">
            <span className="login-badge">同一套 session</span>
            <span className="login-badge">创作者 / 商家并行</span>
            <span className="login-badge">后台独立治理</span>
          </div>
        </div>
        <div className="login-form-panel">
          <div className="login-form-header">
            <p className="section-kicker">Demo Access</p>
            <h2>进入 Web 版创意喵</h2>
            <p>默认填入混合账号，登录后直接进入移动布局，并可切换创作者与商家视图。</p>
          </div>
          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit({
                identifier,
                secret,
                client: "web"
              });
            }}
          >
            <div className="field">
              <label htmlFor="web-login-identifier">账号</label>
              <input
                id="web-login-identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="web-login-secret">口令</label>
              <input
                id="web-login-secret"
                type="password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
              />
            </div>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "登录中..." : "进入创意喵"}
            </button>
          </form>
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
        </div>
      </div>
    </section>
  );
}
