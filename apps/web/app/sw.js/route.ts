import { createSerwistRoute } from "@serwist/turbopack";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf-8",
  }).stdout?.trim() ?? crypto.randomUUID();

const { GET: serwistGet } = createSerwistRoute({
  swSrc: "app/sw.ts",
  additionalPrecacheEntries: [{ url: "/offline", revision }],
  useNativeEsbuild: true,
});

export const GET = (request: Request) =>
  serwistGet(request, { params: Promise.resolve({ path: "sw.js" }) });
