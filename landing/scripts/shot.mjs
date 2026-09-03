// Full-page screenshot with real device emulation via Chrome DevTools Protocol.
// usage: node scripts/shot.mjs <url> <out.png> <width> [height] [scale]
import { spawn } from "node:child_process";
const [url, out, w = "390", h = "844", scale = "1"] = process.argv.slice(2);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", "--disable-gpu", "--remote-debugging-port=9333", "--user-data-dir=/tmp/adler-chrome", "about:blank"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1200));
const targets = await (await fetch("http://localhost:9333/json")).json();
const ws = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(m.error) : p.res(m.result); } };
await new Promise(r => ws.onopen = r);
await send("Emulation.setDeviceMetricsOverride", { width: +w, height: +h, deviceScaleFactor: +scale, mobile: +w < 700 });
await send("Page.enable");
await send("Page.navigate", { url });
await new Promise(r => setTimeout(r, 2500));
const { cssContentSize } = await send("Page.getLayoutMetrics");
await send("Emulation.setDeviceMetricsOverride", { width: +w, height: Math.ceil(cssContentSize.height), deviceScaleFactor: +scale, mobile: +w < 700 });
await new Promise(r => setTimeout(r, 800));
const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
const { writeFileSync } = await import("node:fs");
writeFileSync(out, Buffer.from(data, "base64"));
const sw = await send("Runtime.evaluate", { expression: "document.documentElement.scrollWidth + 'x' + innerWidth", returnByValue: true });
console.log(out, "scrollWidth x innerWidth =", sw.result.value);
ws.close(); chrome.kill();
