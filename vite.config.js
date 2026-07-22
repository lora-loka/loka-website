import { defineConfig } from 'vite'
import { resolve } from 'path'

// The careers listing lives at /careers/index.html; each open role lives at
// /careers/<slug>/index.html. Vite's dev server only resolves a directory's
// index.html when the URL has a trailing slash, so we add one for /careers and
// for each role path. Production (vercel.json cleanUrls) handles this natively;
// this keeps `npm run dev` matching prod.
function cleanUrlRewrite() {
  return {
    name: 'clean-url-rewrite',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url.split('?')[0]
        // /careers or /careers/<slug> (no trailing slash) → add one so the
        // directory index resolves.
        if (/^\/careers(\/[^/]+)?$/.test(path)) {
          req.url = path + '/' + req.url.slice(path.length)
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [cleanUrlRewrite()],
  server: {
    port: 5174,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        careers: resolve(__dirname, 'careers/index.html'),
        careersNarrative: resolve(__dirname, 'careers/head-of-narrative/index.html'),
        careersMl: resolve(__dirname, 'careers/ml-researcher/index.html'),
      },
    },
  },
})
