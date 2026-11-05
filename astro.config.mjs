// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Fully static. No SSR adapter: docs/decisions/0002-vercel-static-hosting.md. If an endpoint is
  // ever needed it becomes a standalone Vercel Function, not an adapter over the whole site.
  output: 'static',

  // Required for canonical URLs, the sitemap and absolute Open Graph paths (M1-7).
  site: 'https://raymondkbakerjr.com',

  // The index page must ship zero client-side JavaScript (docs/architecture.md -> Performance
  // budget). Inlining a small stylesheet avoids a second request rather than adding one.
  build: { inlineStylesheets: 'auto' },
});
