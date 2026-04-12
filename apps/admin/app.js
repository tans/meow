/**
 * admin/app.js — 运营后台 jQuery SPA
 * API_BASE = "/api" (通过 entry 网关代理)
 */
const API_BASE = "/api";
const SESSION_KEY = "meow-admin-session";

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  session: JSON.parse(localStorage.getItem(SESSION_KEY) || "null"),
};

// ── Router ────────────────────────────────────────────────────────────────────
const ROUTES = [
  { key: "login",     label: "登录",    icon: "fa-right-to-bracket" },
  { key: "dashboard", label: "仪表盘",  icon: "fa-chart-line" },
  { key: "tasks",     label: "任务",    icon: "fa-list-check" },
  { key: "users",     label: "用户",    icon: "fa-users" },
  { key: "ledger",    label: "账务",    icon: "fa-scale-balanced" },
  { key: "settings",  label: "设置",    icon: "fa-sliders" },
];

function currentRoute() {
  return location.hash.replace(/^#\/?/, "") || "login";
}

// ── API helper ─────────────────────────────────────────────────────────────────
async function api(path, options = {}) {
  const resp = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (resp.status === 401) {
    clearSession();
    location.hash = "#/login";
    render();
    throw Object.assign(new Error("unauthorized"), { _unauthorized: true });
  }

  if (!resp.ok) {
    const payload = await resp.json().catch(() => ({ error: "request failed" }));
    throw new Error(payload.error || `HTTP ${resp.status}`);
  }

  return resp.json();
}

// ── Session management ─────────────────────────────────────────────────────────
function saveSession(session) {
  state.session = session;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  state.session = null;
  localStorage.removeItem(SESSION_KEY);
}

// 页面加载时从 cookie 同步 session（跨 tab 登录兼容）
async function syncSession() {
  try {
    const session = await api("/auth/session");
    saveSession(session);
    return session;
  } catch {
    clearSession();
    return null;
  }
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function renderNav() {
  $("#nav-links").html(
    ROUTES.filter(r => r.key !== "login")
      .map(r => `<li><a href="#/${r.key}" class="${currentRoute() === r.key ? "active" : ""}"><i class="fa-solid ${r.icon} w-5"></i>${r.label}</a></li>`)
      .join("")
  );
  if (state.session) {
    $("#logout-area").html(`<button class="btn btn-sm btn-ghost" id="logout-btn"><i class="fa-solid fa-right-from-bracket"></i> 退出</button>`);
  } else {
    $("#logout-area").empty();
  }
}

// ── Page renders ───────────────────────────────────────────────────────────────

function renderLogin(errorMsg = "") {
  renderNav();
  $("#page-title").text("运营登录");
  $("#session-pill").text("未登录");
  $("#app").html(`
    <section class="ops-login">
      <h2>运营后台登录</h2>
      <p class="mb-4 text-sm text-slate-500">Demo 账号：<code>operator@example.com</code> / <code>demo-pass</code></p>
      ${errorMsg ? `<div class="alert alert-error mb-4"><span>${errorMsg}</span></div>` : ""}
      <form id="login-form" class="space-y-4">
        <label class="form-control">
          <span class="label-text">账号</span>
          <input class="input input-bordered" name="identifier" value="operator@example.com" />
        </label>
        <label class="form-control">
          <span class="label-text">密码</span>
          <input class="input input-bordered" name="secret" type="password" value="demo-pass" />
        </label>
        <button class="btn btn-primary w-full">登录</button>
      </form>
    </section>
  `);
}

async function renderDashboard() {
  const d = await api("/admin/dashboard");
  $("#app").html(`
    <section class="ops-stats">
      <article class="ops-kpi"><span>活跃任务</span><strong>${d.activeTasks}</strong></article>
      <article class="ops-kpi"><span>今日投稿</span><strong>${d.submissionsToday}</strong></article>
      <article class="ops-kpi"><span>冻结金额</span><strong>${d.frozenAmount}</strong></article>
    </section>
  `);
}

async function renderTasks() {
  const data = await api("/admin/tasks?page=1&pageSize=20");
  $("#app").html(`
    <section>
      <h2 class="mb-4 text-lg font-bold">任务列表</h2>
      <table class="table table-zebra w-full">
        <thead><tr><th>ID</th><th>标题</th><th>状态</th><th>投稿</th><th>Escrow</th></tr></thead>
        <tbody>
          ${data.items.map(t => `<tr><td class="font-mono text-xs">${t.id}</td><td>${t.title}</td><td><span class="badge badge-sm">${t.status}</span></td><td>${t.submissionCount ?? 0}</td><td>${t.escrowLockedAmount}</td></tr>`).join("")}
        </tbody>
      </table>
    </section>
  `);
}

async function renderUsers() {
  const data = await api("/admin/users?page=1&pageSize=20");
  $("#app").html(`
    <section>
      <h2 class="mb-4 text-lg font-bold">用户列表</h2>
      <table class="table table-zebra w-full">
        <thead><tr><th>ID</th><th>账号</th><th>角色</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          ${data.items.map(u => `
            <tr>
              <td class="font-mono text-xs">${u.id}</td>
              <td>${u.identifier}</td>
              <td>${u.roles.map(r => `<span class="badge badge-outline badge-sm mr-1">${r}</span>`).join("")}</td>
              <td><span class="badge badge-sm ${u.state === "active" ? "badge-success" : "badge-error"}">${u.state}</span></td>
              <td>
                ${u.state === "active" ? `<button class="btn btn-xs btn-error ban-user" data-id="${u.id}">封禁</button>` : `<button class="btn btn-xs btn-success unban-user" data-id="${u.id}">解封</button>`}
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    </section>
  `);
}

async function renderLedger() {
  const data = await api("/admin/ledger?page=1&pageSize=30");
  $("#app").html(`
    <section>
      <h2 class="mb-4 text-lg font-bold">账务台账</h2>
      <table class="table table-zebra w-full text-sm">
        <thead><tr><th>ID</th><th>账户</th><th>金额</th><th>方向</th><th>备注</th><th>异常</th></tr></thead>
        <tbody>
          ${data.items.map(e => `<tr>
            <td class="font-mono text-xs">${e.id}</td>
            <td>${e.account}</td>
            <td class="${e.direction === "in" ? "text-success" : "text-error"}">${e.direction === "in" ? "+" : "-"}${e.amount}</td>
            <td>${e.direction}</td>
            <td class="max-w-xs truncate">${e.note}</td>
            <td>${e.anomalyReason ? `<span class="badge badge-error badge-sm">${e.anomalyReason}</span>` : "—"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </section>
  `);
}

async function renderSettings() {
  const data = await api("/admin/settings");
  $("#app").html(`
    <section>
      <h2 class="mb-4 text-lg font-bold">系统设置</h2>
      <form id="settings-form" class="space-y-4 max-w-lg">
        <label class="form-control">
          <span class="label-text">允许发布任务</span>
          <select class="select select-bordered" name="allowTaskPublish">
            <option value="true" ${data.allowTaskPublish ? "selected" : ""}>允许</option>
            <option value="false" ${!data.allowTaskPublish ? "selected" : ""}>禁止</option>
          </select>
        </label>
        <label class="form-control">
          <span class="label-text">允许打赏</span>
          <select class="select select-bordered" name="enableTipReward">
            <option value="true" ${data.enableTipReward ? "selected" : ""}>允许</option>
            <option value="false" ${!data.enableTipReward ? "selected" : ""}>禁止</option>
          </select>
        </label>
        <label class="form-control">
          <span class="label-text">每日奖励上限</span>
          <input class="input input-bordered" name="dailyTaskRewardCap" type="number" value="${data.dailyTaskRewardCap ?? 100}" />
        </label>
        <button class="btn btn-primary">保存设置</button>
      </form>
    </section>
  `);
}

// ── Main render ────────────────────────────────────────────────────────────────
async function render() {
  renderNav();

  const route = currentRoute();
  const routeMeta = ROUTES.find(r => r.key === route) || ROUTES[0];
  $("#page-title").text(routeMeta.label);
  $("#session-pill").text(state.session ? `${state.session.activeRole}` : "未登录");

  // login 页不需要 session
  if (route === "login") {
    renderLogin();
    return;
  }

  // 保护页面：必须已登录
  if (!state.session) {
    location.hash = "#/login";
    render();
    return;
  }

  // 路由分发
  try {
    if (route === "dashboard") await renderDashboard();
    else if (route === "tasks") await renderTasks();
    else if (route === "users") await renderUsers();
    else if (route === "ledger") await renderLedger();
    else if (route === "settings") await renderSettings();
    else location.hash = "#/dashboard";
  } catch (err) {
    if (err._unauthorized) return;
    $("#app").html(`<div class="alert alert-error"><span>加载失败：${err.message}</span></div>`);
  }
}

// ── Event handlers ─────────────────────────────────────────────────────────────

// 登录
$(document).on("submit", "#login-form", async function (e) {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  try {
    const session = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: fd.get("identifier"),
        secret: fd.get("secret"),
        client: "admin",
      }),
    });
    saveSession(session);
    location.hash = "#/dashboard";
    render();
  } catch (err) {
    renderLogin(err.message);
  }
});

// 保存设置
$(document).on("submit", "#settings-form", async function (e) {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  await api("/admin/settings", {
    method: "PUT",
    body: JSON.stringify({
      allowTaskPublish: fd.get("allowTaskPublish") === "true",
      enableTipReward: fd.get("enableTipReward") === "true",
      dailyTaskRewardCap: Number(fd.get("dailyTaskRewardCap")),
    }),
  });
  render();
});

// 封禁/解封用户
$(document).on("click", ".ban-user", async function () {
  const userId = $(this).data("id");
  if (!confirm(`确认封禁用户 ${userId}？`)) return;
  await api(`/admin/users/${userId}/ban`, { method: "POST", body: JSON.stringify({ reason: "admin ban" }) });
  render();
});

$(document).on("click", ".unban-user", async function () {
  const userId = $(this).data("id");
  await api(`/admin/users/${userId}/unban`, { method: "POST", body: JSON.stringify({ reason: "admin unban" }) });
  render();
});

// 退出
$(document).on("click", "#logout-btn", function () {
  clearSession();
  location.hash = "#/login";
  render();
});

// hash 路由
$(window).on("hashchange", render);

// ── Boot ───────────────────────────────────────────────────────────────────────
(async () => {
  // 尝试从 cookie 同步已有 session
  if (state.session) {
    await syncSession();
  }
  render();
})();
