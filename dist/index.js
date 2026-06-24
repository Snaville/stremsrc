#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stremio_addon_sdk_1 = require("stremio-addon-sdk");
const undici_1 = require("undici");
const fetch_socks_1 = require("fetch-socks");
const addon_1 = __importDefault(require("./addon"));
// ponytail: the upstream withholds streams from datacenter IPs at the prorcp step.
// When SOCKS_PROXY is set (e.g. a Cloudflare WARP sidecar), route ALL outbound
// fetch() through it so the addon's egress isn't a flagged datacenter IP.
const socks = process.env.SOCKS_PROXY;
if (socks) {
    const u = new URL(socks);
    (0, undici_1.setGlobalDispatcher)((0, fetch_socks_1.socksDispatcher)({ type: 5, host: u.hostname, port: Number(u.port) }));
    globalThis.fetch = undici_1.fetch;
    console.log(`[stremsrc] routing upstream fetch via ${socks}`);
    // one-shot egress check: prints exit IP + whether WARP is active
    (0, undici_1.fetch)("https://www.cloudflare.com/cdn-cgi/trace")
        .then((r) => r.text())
        .then((t) => {
        var _a, _b;
        return console.log(`[stremsrc] egress ${(_a = t.match(/ip=.*/)) === null || _a === void 0 ? void 0 : _a[0]} ${(_b = t.match(/warp=.*/)) === null || _b === void 0 ? void 0 : _b[0]}`);
    })
        .catch((e) => console.log(`[stremsrc] egress check failed: ${e.message}`));
}
(0, stremio_addon_sdk_1.serveHTTP)(addon_1.default, { port: parseInt(process.env.PORT || "56245") });
// when you've deployed your addon, un-comment this line
// publishToCentral("https://my-addon.awesome/manifest.json")
// for more information on deploying, see: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/deploying/README.md
