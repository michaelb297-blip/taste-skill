/* Baut die serverlose Einzeldatei-Version: static/dist/performance-lab.html
 * Voraussetzung: `npm run build` (liefert das fertige Tailwind-CSS). */
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const shim = path.join(root, "static/next-shim.tsx");

const rewrite = {
  name: "upl-rewrite",
  setup(b) {
    b.onLoad({ filter: /[\\/]src[\\/].*\.tsx?$/ }, async (args) => {
      let code = await fs.promises.readFile(args.path, "utf8");
      code = code
        .replaceAll("window.location.search", "(window as any).__uplSearch()")
        .replaceAll('window.history.pushState(null, "", ', "(window as any).__uplNav(")
        .replaceAll('"popstate"', '"upl:nav"');
      return { contents: code, loader: args.path.endsWith("x") ? "tsx" : "ts" };
    });
  },
};

const out = await build({
  entryPoints: [path.join(root, "static/entry.tsx")],
  bundle: true, minify: true, format: "iife", target: "es2020", write: false, jsx: "automatic", legalComments: "none",
  alias: { "next/link": shim, "next/navigation": shim, "@": path.join(root, "src") },
  define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" },
  plugins: [rewrite],
});
const js = out.outputFiles[0].text.replaceAll("</script", "<\\/script");

const cssDir = path.join(root, ".next/static/chunks");
const css = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css")).map((f) => fs.readFileSync(path.join(cssDir, f), "utf8")).join("\n")
  .replace(/@font-face\s*\{[^}]*\}/g, "");

const html = `<title>Ultimate Performance Lab</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap">
<style>
/* Einheitlich dunkles Interface (bewusst ein Thema). Schrift: Geist / Geist Mono. */
:root{color-scheme:dark;--font-geist-sans:"Geist",ui-sans-serif,system-ui,sans-serif;--font-geist-mono:"Geist Mono",ui-monospace,monospace}
${css}
</style>
<div id="root"></div>
<script>${js}</script>
`;
fs.mkdirSync(path.join(root, "static/dist"), { recursive: true });
fs.writeFileSync(path.join(root, "static/dist/performance-lab.html"), html);
console.log(`performance-lab.html: ${(html.length / 1024).toFixed(0)} KB (JS ${(js.length / 1024).toFixed(0)} KB, CSS ${(css.length / 1024).toFixed(0)} KB)`);
