"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProrcp = resolveProrcp;
const patchright_1 = require("patchright");
// Real Chrome + patchright stealth driver passes cloudorchestra's invisible
// Cloudflare Turnstile, which a plain fetch cannot. One persistent context is
// reused across requests; Chrome egresses via SOCKS_PROXY (home exit node) when set.
let ctxPromise = null;
function getContext() {
    if (!ctxPromise) {
        const proxy = process.env.SOCKS_PROXY;
        ctxPromise = patchright_1.chromium
            .launchPersistentContext("/tmp/chrome-profile", Object.assign({ 
            // headful (real X display via Xvfb in the container) — passes Turnstile even
            // when the IP is flagged; headless only passes on a pristine IP.
            headless: false, executablePath: process.env.CHROME_PATH || undefined, channel: process.env.CHROME_PATH ? undefined : "chrome", viewport: { width: 1280, height: 720 }, args: [
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
            ] }, (proxy ? { proxy: { server: proxy } } : {})))
            .catch((e) => {
            ctxPromise = null; // allow retry on next request if launch failed
            throw e;
        });
    }
    return ctxPromise;
}
// Load a prorcp URL in real Chrome, let Turnstile auto-solve, return the stream URL
// from the page's `file:` var (first of any " or "-joined fallbacks).
function resolveProrcp(url, referer) {
    return __awaiter(this, void 0, void 0, function* () {
        const ctx = yield getContext();
        const page = yield ctx.newPage();
        try {
            yield page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 45000,
                referer: `${referer}/`,
            });
            for (let i = 0; i < 30; i++) {
                const html = yield page.content();
                const m = html.match(/file:\s*["']([^"']+)["']/);
                if (m && m[1])
                    return m[1].split(" or ")[0].trim();
                yield page.waitForTimeout(1000);
            }
            return null;
        }
        finally {
            yield page.close().catch(() => { });
        }
    });
}
