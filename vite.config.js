import { defineConfig } from 'vite'
import { resolve } from 'path'

// These libraries prefer window.THREE even in their ESM distributions. Keep
// their modern imported constructors separate from the original site's r128
// global, without changing that global or the existing brand scenes.
const isolatedGraphPackages = ['3d-force-graph', 'three-forcegraph', 'three-render-objects']
function isolateGraphThree() {
  return {
    name: 'isolate-graph-three',
    enforce: 'pre',
    transform(code, id) {
      if (!isolatedGraphPackages.some(name => id.includes(`/node_modules/${name}/`))) return
      if (!code.includes('window.THREE')) return
      return { code: code.replace(/\bwindow\.THREE\b/g, 'undefined'), map: null }
    },
  }
}

// Resolve directory entry points consistently in dev, preview, and production
// (where vercel.json enables clean URLs).
function cleanUrlRewrite() {
  const install = (server) => {
    server.middlewares.use((req, res, next) => {
      const path = req.url.split('?')[0]
      if (/^\/(?:blog|careers(?:\/[^/]+)?)$/.test(path)) {
        req.url = path + '/' + req.url.slice(path.length)
      }
      next()
    })
  }
  return {
    name: 'clean-url-rewrite',
    configureServer: install,
    configurePreviewServer: install,
  }
}

export default defineConfig({
  plugins: [isolateGraphThree(), cleanUrlRewrite()],
  optimizeDeps: {
    exclude: isolatedGraphPackages,
    // Excluded ESM packages still need their CommonJS children pre-bundled.
    include: ['three-forcegraph > ngraph.forcelayout', 'three-forcegraph > ngraph.graph', 'three-forcegraph > tinycolor2'],
  },
  server: {
    port: 5174,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        blog: resolve(__dirname, 'blog/index.html'),
        careers: resolve(__dirname, 'careers/index.html'),
        careersNarrative: resolve(__dirname, 'careers/head-of-narrative/index.html'),
        careersMl: resolve(__dirname, 'careers/ml-researcher/index.html'),
      },
    },
  },
})
