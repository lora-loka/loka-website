// Keep the first screen light: load the separate Three.js module only near the
// simulation section. The existing r128 window.THREE is never changed.
const panel = document.getElementById('causation');
const layer = panel?.querySelector('.economic-background');
if (panel && layer) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let scene, loading, near = false, visible = false, disposed = false, renderingFailed = false;
  layer.dataset.state = 'static';

  async function sync() {
    if (renderingFailed) {
      scene?.setActive(false);
      layer.dataset.state = 'static';
      return;
    }
    const shouldRun = visible && !document.hidden && !reducedMotion.matches && !disposed;
    if (scene) {
      scene.setActive(shouldRun);
      layer.dataset.state = reducedMotion.matches ? 'static' : shouldRun ? 'running' : 'paused';
      return;
    }
    if (!near || reducedMotion.matches || document.hidden || disposed || loading) return;
    loading = import('./economic-scene.js')
      .then(({ createEconomicScene }) => {
        if (disposed || reducedMotion.matches) return;
        scene = createEconomicScene(layer.querySelector('.economic-webgl'), panel);
        scene.onContextLost(() => { renderingFailed = true; layer.dataset.state = 'static'; });
        sync();
      })
      .catch(() => { renderingFailed = true; layer.dataset.state = 'static'; })
      .finally(() => { loading = null; });
  }
  const preloadObserver = new IntersectionObserver(entries => {
    near = entries[0].isIntersecting;
    sync();
  }, { rootMargin: '45% 0px' });
  const visibilityObserver = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }, { threshold: 0 });
  preloadObserver.observe(panel);
  visibilityObserver.observe(panel);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  window.addEventListener('pagehide', event => {
    scene?.setActive(false);
    if (!event.persisted) {
      disposed = true;
      scene?.destroy();
      preloadObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reducedMotion.removeEventListener('change', sync);
    }
  });
  window.addEventListener('pageshow', sync);
}
