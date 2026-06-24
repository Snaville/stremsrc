#!/usr/bin/env node

import { serveHTTP } from "stremio-addon-sdk";
import { fetch as undiciFetch, setGlobalDispatcher } from "undici";
import { socksDispatcher } from "fetch-socks";
import addonInterface from "./addon";

// ponytail: the upstream withholds streams from datacenter IPs at the prorcp step.
// When SOCKS_PROXY is set (e.g. a Cloudflare WARP sidecar), route ALL outbound
// fetch() through it so the addon's egress isn't a flagged datacenter IP.
const socks = process.env.SOCKS_PROXY;
if (socks) {
  const u = new URL(socks);
  setGlobalDispatcher(
    socksDispatcher({ type: 5, host: u.hostname, port: Number(u.port) }) as any
  );
  (globalThis as any).fetch = undiciFetch;
  console.log(`[stremsrc] routing upstream fetch via ${socks}`);
  // one-shot egress check: prints exit IP + whether WARP is active
  undiciFetch("https://www.cloudflare.com/cdn-cgi/trace")
    .then((r) => r.text())
    .then((t) =>
      console.log(
        `[stremsrc] egress ${t.match(/ip=.*/)?.[0]} ${t.match(/warp=.*/)?.[0]}`
      )
    )
    .catch((e) => console.log(`[stremsrc] egress check failed: ${e.message}`));
}

serveHTTP(addonInterface, { port: parseInt(process.env.PORT || "56245") });

// when you've deployed your addon, un-comment this line
// publishToCentral("https://my-addon.awesome/manifest.json")
// for more information on deploying, see: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/deploying/README.md
