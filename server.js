import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

app.use((req, res, next) => {
  if (req.path.endsWith(".webmanifest")) {
    res.type("application/manifest+json");
  }
  if (req.path === "/" || req.path.endsWith(".html") || req.path === "/sw.js" || req.path.endsWith(".webmanifest")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

app.use(express.static(__dirname, { index: "index.html", etag: false, lastModified: false }));

app.get("*", (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`Claw Quest listening on http://${HOST}:${PORT}`);
});
