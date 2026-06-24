import { chromium, BrowserContext } from "patchright";

// Real Chrome + patchright stealth driver passes cloudorchestra's invisible
// Cloudflare Turnstile, which a plain fetch cannot. One persistent context is
// reused across requests; Chrome egresses via SOCKS_PROXY (home exit node) when set.
let ctxPromise: Promise<BrowserContext> | null = null;

function getContext(): Promise<BrowserContext> {
  if (!ctxPromise) {
    const proxy = process.env.SOCKS_PROXY;
    ctxPromise = chromium
      .launchPersistentContext("/tmp/chrome-profile", {
        // headful (real X display via Xvfb in the container) — passes Turnstile even
        // when the IP is flagged; headless only passes on a pristine IP.
        headless: false,
        executablePath: process.env.CHROME_PATH || undefined,
        channel: process.env.CHROME_PATH ? undefined : "chrome",
        viewport: { width: 1280, height: 720 },
        args: [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-blink-features=AutomationControlled",
        ],
        ...(proxy ? { proxy: { server: proxy } } : {}),
      })
      .catch((e) => {
        ctxPromise = null; // allow retry on next request if launch failed
        throw e;
      });
  }
  return ctxPromise;
}

// Load a prorcp URL in real Chrome, let Turnstile auto-solve, return the stream URL
// from the page's `file:` var (first of any " or "-joined fallbacks).
export async function resolveProrcp(
  url: string,
  referer: string
): Promise<string | null> {
  const ctx = await getContext();
  const page = await ctx.newPage();
  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
      referer: `${referer}/`,
    });
    for (let i = 0; i < 30; i++) {
      const html = await page.content();
      const m = html.match(/file:\s*["']([^"']+)["']/);
      if (m && m[1]) return m[1].split(" or ")[0].trim();
      await page.waitForTimeout(1000);
    }
    return null;
  } finally {
    await page.close().catch(() => {});
  }
}
