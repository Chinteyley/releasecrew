import assert from "node:assert/strict";
import { test } from "node:test";
import { RecoverableError, withRetry } from "./retry.js";

test("retries a recoverable failure then succeeds", async () => {
  let calls = 0;
  const value = await withRetry(
    {
      name: "demo.tool",
      attempts: 3,
      baseDelayMs: 1,
      retryOn: (error) => error instanceof RecoverableError,
    },
    async () => {
      calls += 1;
      if (calls === 1) throw new RecoverableError("boom", 1);
      return "ok";
    },
  );
  assert.equal(value, "ok");
  assert.equal(calls, 2);
});
