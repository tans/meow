import { afterAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { createDemoAuthCleanup, toCookieHeader } from "./helpers.js";

const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024;

interface CreateTaskDraftResponse {
  taskId: string;
  status: "draft";
}

interface UploadMerchantTaskAssetsResponse {
  attachments: Array<{
    id: string;
    kind: "image" | "video";
    url: string;
    fileName: string;
    mimeType: string;
  }>;
}

const loginMerchant = async (): Promise<string> => {
  process.env.MEOW_DEMO_AUTH = "true";

  const response = await app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      identifier: "merchant@example.com",
      secret: "demo-pass",
      client: "web"
    })
  });

  expect(response.status).toBe(200);
  const setCookieHeader = response.headers.get("set-cookie") ?? "";
  const cookieHeader = toCookieHeader(setCookieHeader);
  expect(cookieHeader).toContain("meow_session=");

  return cookieHeader;
};

describe("merchant publish flow", () => {
  afterAll(createDemoAuthCleanup());

  it("locks base and ranking budget before publishing", async () => {
    const merchantCookie = await loginMerchant();
    const response = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { cookie: merchantCookie }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      ledgerEffect: "merchant_escrow_locked"
    });
  });

  it("persists uploaded attachments and task title in task detail", async () => {
    const merchantCookie = await loginMerchant();
    const formData = new FormData();
    formData.append(
      "files",
      new File(["fake-image"], "brief.png", { type: "image/png" })
    );
    formData.append(
      "files",
      new File(["fake-video"], "brief.mp4", { type: "video/mp4" })
    );

    const uploadResponse = await app.request("/merchant/uploads", {
      method: "POST",
      headers: { cookie: merchantCookie },
      body: formData
    });

    expect(uploadResponse.status).toBe(201);
    const uploaded = (await uploadResponse.json()) as UploadMerchantTaskAssetsResponse;
    expect(uploaded).toMatchObject({
      attachments: [
        expect.objectContaining({
          kind: "image",
          fileName: "brief.png"
        }),
        expect.objectContaining({
          kind: "video",
          fileName: "brief.mp4"
        })
      ]
    });

    const createResponse = await app.request("/merchant/tasks", {
      method: "POST",
      headers: {
        cookie: merchantCookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        title: "夏日探店需求",
        assetAttachments: uploaded.attachments
      })
    });

    expect(createResponse.status).toBe(201);
    const draft = (await createResponse.json()) as CreateTaskDraftResponse;

    const publishResponse = await app.request(`/merchant/tasks/${draft.taskId}/publish`, {
      method: "POST",
      headers: { cookie: merchantCookie }
    });

    expect(publishResponse.status).toBe(200);

    const detailResponse = await app.request(`/merchant/tasks/${draft.taskId}`, {
      headers: { cookie: merchantCookie }
    });

    expect(detailResponse.status).toBe(200);
    await expect(detailResponse.json()).resolves.toMatchObject({
      id: draft.taskId,
      title: "夏日探店需求",
      assetAttachments: [
        expect.objectContaining({
          kind: "image",
          fileName: "brief.png"
        }),
        expect.objectContaining({
          kind: "video",
          fileName: "brief.mp4"
        })
      ]
    });
  });

  it("rejects upload requests whose declared body size exceeds the limit", async () => {
    const merchantCookie = await loginMerchant();
    const request = new Request("http://localhost/merchant/uploads", {
      method: "POST",
      headers: {
        cookie: merchantCookie,
        "content-type": "multipart/form-data; boundary=upload-limit-test",
        "content-length": String(MAX_UPLOAD_FILE_BYTES + 1)
      },
      body: "--upload-limit-test--"
    });

    const response = await app.request(request);

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: "upload request too large",
      status: 413
    });
  });

  it("rejects uploaded files larger than the per-file limit before reading them", async () => {
    const merchantCookie = await loginMerchant();
    const formData = new FormData();
    formData.append(
      "files",
      new File([new Uint8Array(MAX_UPLOAD_FILE_BYTES + 1)], "too-large.png", {
        type: "image/png"
      })
    );

    const response = await app.request("/merchant/uploads", {
      method: "POST",
      headers: { cookie: merchantCookie },
      body: formData
    });

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: "upload file too large",
      status: 413
    });
  });
});
