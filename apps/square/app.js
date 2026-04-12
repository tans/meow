const API_BASE = "/api";
const STORAGE_KEY = "meow-creator-session";
const state = {
  session: JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"),
};

function route() {
  return location.hash.replace(/^#\/?/, "") || "feed";
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
  return response.json();
}

function setSession(session) {
  state.session = session;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

async function ensureSession() {
  const session = await api("/auth/session");
  setSession(session);
  return session;
}

function loginHint(error = "") {
  return `
    <section>
      <h2 class="text-2xl font-bold mb-3">先登录再开始投稿</h2>
      <p class="mb-4 text-slate-600">Demo 创作者账号：creator@example.com / demo-pass</p>
      ${error ? `<div class="alert alert-error mb-3">${error}</div>` : ""}
      <button class="btn btn-primary w-full" id="quick-login">使用 Demo 登录</button>
    </section>
  `;
}

async function renderFeed() {
  const tasks = await api("/creator/tasks");
  $("#app").html(`
    <section>
      <h2 class="text-xl font-bold mb-4">公开任务</h2>
      ${
        tasks.length
          ? tasks
              .map(
                (task) => `
                  <article class="task-card rounded-2xl border border-slate-200 p-4">
                    <div class="flex items-center justify-between gap-3">
                      <div>
                        <h3 class="font-bold text-lg">${task.title}</h3>
                        <p class="text-slate-500 text-sm">任务 ${task.id}</p>
                      </div>
                      <span class="badge badge-primary badge-outline">奖励池 ${task.rewardAmount}</span>
                    </div>
                    <form class="grid gap-3 mt-4" data-task-id="${task.id}">
                      <input class="input input-bordered" name="assetUrl" placeholder="作品 URL" />
                      <textarea class="textarea textarea-bordered" name="description" placeholder="作品说明"></textarea>
                      <button class="btn btn-primary">立即投稿</button>
                    </form>
                  </article>
                `,
              )
              .join("")
          : `<p class="text-slate-500">当前没有已发布任务。</p>`
      }
    </section>
  `);
}

async function renderSubmissions() {
  const data = await api("/creator/submissions?page=1&pageSize=20");
  $("#app").html(`
    <section>
      <h2 class="text-xl font-bold mb-4">我的投稿</h2>
      <div class="space-y-3">
        ${data.items
          .map(
            (item) => `
              <article class="rounded-2xl border border-slate-200 p-4">
                <div class="flex items-center justify-between">
                  <strong>${item.id}</strong>
                  <span class="badge">${item.status}</span>
                </div>
                <p class="text-sm text-slate-500 mt-2">任务 ${item.taskId} · 奖励标签 ${item.rewardTags.join(", ") || "无"}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `);
}

async function renderEarnings() {
  const wallet = await api("/creator/wallet");
  $("#app").html(`
    <section>
      <h2 class="text-xl font-bold mb-4">收益快照</h2>
      <div class="grid grid-cols-2 gap-3">
        <article class="rounded-2xl bg-indigo-50 p-4"><span>冻结收益</span><strong class="block text-3xl mt-2">${wallet.frozenAmount}</strong></article>
        <article class="rounded-2xl bg-emerald-50 p-4"><span>可用收益</span><strong class="block text-3xl mt-2">${wallet.availableAmount}</strong></article>
      </div>
      <p class="mt-4 text-slate-500">累计投稿 ${wallet.submissionCount} 条</p>
    </section>
  `);
}

function renderProfile() {
  $("#app").html(`
    <section>
      <h2 class="text-xl font-bold mb-4">我的账号</h2>
      <div class="rounded-2xl border border-slate-200 p-4">
        <p>当前角色：creator</p>
        <p class="text-slate-500 mt-2">如需重置，可直接重新点击顶部 Demo 登录。</p>
      </div>
    </section>
  `);
}

async function render() {
  const current = route();
  $("#creator-title").text({
    feed: "任务广场",
    "my-submissions": "我的投稿",
    earnings: "收益快照",
    profile: "我的账号",
  }[current] || "任务广场");
  $(".creator-nav a").removeClass("active");
  $(`.creator-nav a[href="#/${current}"]`).addClass("active");

  try {
    await ensureSession();
  } catch (error) {
    $("#app").html(loginHint(error.message));
    return;
  }

  if (current === "feed") return renderFeed();
  if (current === "my-submissions") return renderSubmissions();
  if (current === "earnings") return renderEarnings();
  if (current === "profile") return renderProfile();
  location.hash = "#/feed";
}

$("#creator-login-btn").on("click", async function () {
  await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identifier: "creator@example.com",
      secret: "demo-pass",
      client: "web",
    }),
  });
  render();
});

$(document).on("click", "#quick-login", function () {
  $("#creator-login-btn").trigger("click");
});

$(document).on("submit", "form[data-task-id]", async function (event) {
  event.preventDefault();
  const taskId = $(event.currentTarget).data("task-id");
  const assetUrl = $(event.currentTarget).find("[name=assetUrl]").val();
  const description = $(event.currentTarget).find("[name=description]").val();
  await api(`/creator/tasks/${taskId}/submissions`, {
    method: "POST",
    body: JSON.stringify({ assetUrl, description }),
  });
  location.hash = "#/my-submissions";
  render();
});

$(window).on("hashchange", render);
render();
