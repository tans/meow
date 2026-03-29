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
    <section>
      <h1>登录创意喵</h1>
      <p>沿用小程序的任务流，增加浏览器端登录与角色切换。</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            identifier,
            secret,
            client: "web"
          });
        }}
      >
        <label htmlFor="web-login-identifier">账号</label>
        <input
          id="web-login-identifier"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
        />
        <label htmlFor="web-login-secret">口令</label>
        <input
          id="web-login-secret"
          type="password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "登录中..." : "进入创意喵"}
        </button>
      </form>
      {errorMessage ? <p>{errorMessage}</p> : null}
    </section>
  );
}
