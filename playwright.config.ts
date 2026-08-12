import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [["list"]],
  webServer: [
    {
      command: "npm run dev -w @inlens/example-react-vite -- --host 127.0.0.1",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        "INLENS_NEXT_DIST_DIR=.next-playwright npm run dev -w @inlens/example-nextjs -- --hostname 127.0.0.1 --port 4174",
      url: "http://127.0.0.1:4174",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "react-vite",
      testMatch: /react\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4173",
      },
    },
    {
      name: "next-rsc",
      testMatch: /next-rsc\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4174",
      },
    },
  ],
});
