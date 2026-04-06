export function LoginPage({
  loading,
  onSubmit,
}: {
  loading: boolean;
  onSubmit: (input: { identifier: string; secret: string }) => void | Promise<void>;
}) {
  return (
    <main className="login-shell">
      <section className="panel stack login-card">
        <div className="section-heading">
          <div>
            <p className="card-kicker">Buyer Access</p>
            <h3>登录创意喵发布者平台</h3>
          </div>
        </div>
        <p className="muted">演示环境将使用预置商家账号并通过真实 session 接口登录。</p>
        <button
          type="button"
          className="primary-button"
          disabled={loading}
          onClick={() => onSubmit({ identifier: "merchant@example.com", secret: "demo-pass" })}
        >
          {loading ? "进入中..." : "进入发布者平台"}
        </button>
      </section>
    </main>
  );
}
