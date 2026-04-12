import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createTestContext, loginAs } from "./helpers.js";

const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024;

describe("merchant and creator flows", () => {
  let testContext;

  beforeEach(() => {
    testContext = createTestContext();
  });

  afterEach(() => {
    testContext.cleanup();
  });

  it("uploads attachments, creates a draft, publishes it, and exposes task detail", async () => {
    const merchantCookie = await loginAs(testContext.app, "merchant@example.com");
    const formData = new FormData();
    formData.append("files", new File(["fake-image"], "brief.png", { type: "image/png" }));
    formData.append("files", new File(["fake-video"], "brief.mp4", { type: "video/mp4" }));

    const uploadResponse = await testContext.app.request("/merchant/uploads", {
      method: "POST",
      headers: { cookie: merchantCookie },
      body: formData,
    });

    expect(uploadResponse.status).toBe(201);
    const uploaded = await uploadResponse.json();
    expect(uploaded).toMatchObject({
      attachments: [
        expect.objectContaining({ kind: "image", fileName: "brief.png" }),
        expect.objectContaining({ kind: "video", fileName: "brief.mp4" }),
      ],
    });

    const createResponse = await testContext.app.request("/merchant/tasks", {
      method: "POST",
      headers: {
        cookie: merchantCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        title: "夏日探店需求",
        assetAttachments: uploaded.attachments,
      }),
    });

    expect(createResponse.status).toBe(201);
    const draft = await createResponse.json();

    const publishResponse = await testContext.app.request(`/merchant/tasks/${draft.taskId}/publish`, {
      method: "POST",
      headers: { cookie: merchantCookie },
    });

    expect(publishResponse.status).toBe(200);
    expect(await publishResponse.json()).toMatchObject({
      id: draft.taskId,
      merchantId: "merchant-1",
      status: "published",
      ledgerEffect: "merchant_escrow_locked",
    });

    const detailResponse = await testContext.app.request(`/merchant/tasks/${draft.taskId}`, {
      headers: { cookie: merchantCookie },
    });

    expect(detailResponse.status).toBe(200);
    const detail = await detailResponse.json();
    expect(detail).toMatchObject({
      id: draft.taskId,
      title: "夏日探店需求",
    });
    expect(Array.isArray(detail.assetAttachments)).toBe(true);
    expect(detail.assetAttachments.length).toBe(2);
  });

  it("rejects upload requests whose declared body size exceeds the limit", async () => {
    const merchantCookie = await loginAs(testContext.app, "merchant@example.com");
    const request = new Request("http://localhost/merchant/uploads", {
      method: "POST",
      headers: {
        cookie: merchantCookie,
        "content-type": "multipart/form-data; boundary=upload-limit-test",
        "content-length": String(MAX_UPLOAD_FILE_BYTES + 1),
      },
      body: "--upload-limit-test--",
    });

    const response = await testContext.app.request(request);

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: "upload request too large",
      status: 413,
    });
  });

  it("creates, updates, withdraws, and lists creator submissions", async () => {
    const merchantCookie = await loginAs(testContext.app, "merchant@example.com");
    const creatorCookie = await loginAs(testContext.app, "creator@example.com");

    const publishResponse = await testContext.app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { cookie: merchantCookie },
    });

    expect(publishResponse.status).toBe(200);

    const createResponse = await testContext.app.request("/creator/tasks/task-1/submissions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: creatorCookie,
      },
      body: JSON.stringify({
        assetUrl: "https://example.com/original.mp4",
        description: "first draft",
      }),
    });

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();

    const updateResponse = await testContext.app.request(`/creator/submissions/${created.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        cookie: creatorCookie,
      },
      body: JSON.stringify({
        assetUrl: "https://example.com/edited.mp4",
        description: "edited draft",
      }),
    });

    expect(updateResponse.status).toBe(200);
    expect(await updateResponse.json()).toMatchObject({
      id: created.id,
      assetUrl: "https://example.com/edited.mp4",
      description: "edited draft",
      status: "submitted",
    });

    const listResponse = await testContext.app.request("/creator/submissions?page=1&pageSize=10", {
      headers: { cookie: creatorCookie },
    });

    expect(listResponse.status).toBe(200);
    expect(await listResponse.json()).toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ id: created.id })]),
      pagination: expect.objectContaining({ page: 1, pageSize: 10 }),
    });

    const withdrawResponse = await testContext.app.request(`/creator/submissions/${created.id}/withdraw`, {
      method: "POST",
      headers: { cookie: creatorCookie },
    });

    expect(withdrawResponse.status).toBe(200);
    expect(await withdrawResponse.json()).toEqual({
      submissionId: created.id,
      status: "withdrawn",
    });
  });
});
