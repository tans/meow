const API_BASE = "/api";
const STORAGE_KEY = "meow-merchant-session";
const navItems = [
  ["login", "登录"],
  ["dashboard", "概览"],
  ["tasks", "任务列表"],
  ["tasks/new", "创建任务"],
  ["wallet", "钱包"],
  ["settings", "设置"],
];

const state = {
  session: JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"),
};

function route() {
  return location.hash.replace(/^#\/?/, "") || "login";
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "request failed" }));
    throw new Error(payload.error || "request failed");
  }
  const type = response.headers.get("content-type") || "";
  return type.includes("application/json") ? response.json() : response.text();
}

function renderNav() {
  $("#merchant-nav").html(
    navItems
      .map(([key, label]) => {
        const active = route() === key ? "active" : "";
        return `<li><a class="${active}" href="#/${key}">${label}</a></li>`;
      })
      .join(""),
  );
}

async function ensureSession() {
  const session = await api("/auth/session");
  state.session = session;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

function renderLogin(error = "") {
  $("#app").html(`
    <section class="max-w-xl mx-auto mt-16">
      <h2 class="text-3xl font-bold mb-3">商家 Demo 登录</h2>
      <p class="text-slate-500 mb-5">默认账号：merchant@example.com / demo-pass</p>
      ${error ? `<div class="alert alert-error mb-4">${error}</div>` : ""}
      <button id="merchant-quick-login" class="btn btn-primary">进入商家端</button>
    </section>
  `);
}

async function renderDashboard() {
  const [wallet, tasks] = await Promise.all([
    api("/merchant/wallet"),
    api("/merchant/tasks?page=1&pageSize=20"),
  ]);
  $("#app").html(`
    <section class="grid gap-4 md:grid-cols-3">
      <article class="rounded-2xl bg-orange-50 p-4"><span>Escrow</span><strong class="block text-3xl mt-2">${wallet.escrowAmount}</strong></article>
      <article class="rounded-2xl bg-amber-50 p-4"><span>可退预算</span><strong class="block text-3xl mt-2">${wallet.refundableAmount}</strong></article>
      <article class="rounded-2xl bg-rose-50 p-4"><span>累计打赏</span><strong class="block text-3xl mt-2">${wallet.tipSpentAmount}</strong></article>
      <article class="rounded-2xl border border-slate-200 p-4 md:col-span-3">
        <h3 class="font-bold mb-3">最近任务</h3>
        <div class="space-y-3">
          ${tasks.items
            .map((task) => `<div class="flex justify-between"><span>${task.title}</span><span>${task.status}</span></div>`)
            .join("")}
        </div>
      </article>
    </section>
  `);
}

async function renderTasks() {
  const data = await api("/merchant/tasks?page=1&pageSize=20");
  $("#app").html(`
    <section>
      <h2 class="text-2xl font-bold mb-4">任务列表</h2>
      <div class="space-y-3">
        ${data.items
          .map(
            (task) => `
              <article class="rounded-2xl border border-slate-200 p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <strong>${task.title}</strong>
                    <p class="text-sm text-slate-500">${task.id}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="badge">${task.status}</span>
                    <button class="btn btn-sm btn-outline publish-task" data-task-id="${task.id}">发布</button>
                  </div>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `);
}

function renderTaskCreate() {
  $("#app").html(`
    <section>
      <h2 class="text-2xl font-bold mb-4">创建任务</h2>
      <form id="create-task-form" class="grid gap-4 md:grid-cols-2">
        <input class="input input-bordered md:col-span-2" name="title" placeholder="任务标题" />
        <input class="input input-bordered" name="baseAmount" type="number" value="1" placeholder="基础奖励" />
        <input class="input input-bordered" name="baseCount" type="number" value="1" placeholder="基础名额" />
        <input class="input input-bordered md:col-span-2" name="rankingTotal" type="number" value="3" placeholder="排名奖励池" />
        <button class="btn btn-primary md:col-span-2">创建草稿</button>
      </form>
    </section>
  `);
}

async function renderWallet() {
  const wallet = await api("/merchant/wallet");
  $("#app").html(`
    <section class="grid gap-4 md:grid-cols-2">
      <article class="rounded-2xl border border-slate-200 p-4"><span>Escrow 锁定</span><strong class="block text-3xl mt-2">${wallet.escrowAmount}</strong></article>
      <article class="rounded-2xl border border-slate-200 p-4"><span>可退预算</span><strong class="block text-3xl mt-2">${wallet.refundableAmount}</strong></article>
      <article class="rounded-2xl border border-slate-200 p-4 md:col-span-2"><span>累计打赏</span><strong class="block text-3xl mt-2">${wallet.tipSpentAmount}</strong></article>
    </section>
  `);
}

function renderSettings() {
  $("#app").html(`
    <section>
      <h2 class="text-2xl font-bold mb-4">商家端说明</h2>
      <p class="text-slate-600">当前版本聚焦 demo 链路：创建草稿、发布任务、查看钱包。投稿审核和结算由 API 已经支持，可继续在控制台补更细的交互。</p>
    </section>
  `);
}

async function render() {
  renderNav();
  const current = route();
  $("#merchant-title").text(navItems.find(([key]) => key === current)?.[1] || "商家端");

  if (current === "login") {
    renderLogin();
    return;
  }

  try {
    await ensureSession();
  } catch {
    location.hash = "#/login";
    renderLogin();
    return;
  }

  if (current === "dashboard") return renderDashboard();
  if (current === "tasks") return renderTasks();
  if (current === "tasks/new") return renderTaskCreate();
  if (current === "wallet") return renderWallet();
  if (current === "settings") return renderSettings();
  location.hash = "#/dashboard";
}

$("#merchant-login, #merchant-logout").on("click", async function (event) {
  if (event.currentTarget.id === "merchant-logout") {
    localStorage.removeItem(STORAGE_KEY);
    location.hash = "#/login";
    render();
    return;
  }

  await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identifier: "merchant@example.com",
      secret: "demo-pass",
      client: "web",
    }),
  });
  location.hash = "#/dashboard";
  render();
});

$(document).on("click", "#merchant-quick-login", function () {
  $("#merchant-login").trigger("click");
});

$(document).on("submit", "#create-task-form", async function (event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  await api("/merchant/tasks", {
    method: "POST",
    body: JSON.stringify({
      title: form.get("title"),
      baseAmount: Number(form.get("baseAmount")),
      baseCount: Number(form.get("baseCount")),
      rankingTotal: Number(form.get("rankingTotal")),
    }),
  });
  location.hash = "#/tasks";
  render();
});

$(document).on("click", ".publish-task", async function () {
  await api(`/merchant/tasks/${$(this).data("task-id")}/publish`, {
    method: "POST",
  });
  render();
});

$(window).on("hashchange", render);
render();
