import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(path.join(root, name), "utf8");

const html = read("index.html");
const scriptMatch = html.match(/<script>([\\s\\S]*?)<\\/script>/);
if (!scriptMatch) throw new Error("Inline game script was not found.");
new Function(scriptMatch[1]);

const manifest = JSON.parse(read("manifest.webmanifest"));
if (manifest.display !== "standalone" || manifest.orientation !== "portrait") {
  throw new Error("Manifest must target an installed portrait app.");
}
for (const icon of manifest.icons ?? []) {
  const relative = icon.src.replace(/^\\.\\//, "");
  if (!existsSync(path.join(root, relative))) {
    throw new Error(`Manifest icon is missing: ${icon.src}`);
  }
}
if (!html.includes('rel="manifest"') || !html.includes('serviceWorker.register("./sw.js")')) {
  throw new Error("PWA manifest or service-worker registration is missing.");
}
new Function(read("sw.js"));

console.log("PASS: game JavaScript syntax");
console.log("PASS: PWA manifest and icon references");
console.log("PASS: service-worker JavaScript syntax");
