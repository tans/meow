export function LoginPage({
  loading,
  onSubmit
}: {
  loading: boolean;
  onSubmit: (input: {
    identifier: string;
    secret: string;
    client: "admin";
  }) => void | Promise<void>;
}) {
  return (
    <main className="panel stack">
      <div className="section-heading">
        <div>
          <p className="card-kicker">Operator Access</p>
          <h3>登录创意喵后台</h3>
        </div>
      </div>
      <p>当前版本使用演示 operator 账号直连真实后台 session。</p>
      <button
        type="button"
        className="ghost-button"
        disabled={loading}
        onClick={() =>
          onSubmit({
            identifier: "operator@example.com",
            secret: "demo-pass",
            client: "admin"
          })
        }
      >
        {loading ? "进入中..." : "进入后台"}
      </button>
    </main>
  );
}
