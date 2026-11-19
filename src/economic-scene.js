import ForceGraph3D from '3d-force-graph';
import { Group, Mesh, MeshBasicMaterial, SphereGeometry, IcosahedronGeometry, BoxGeometry, OctahedronGeometry, Color } from 'three';

// Authored types and edges form a conceptual economic network. This is a visual
// study of propagation, not model output, growth rates, or a numerical forecast.
const sectors = ['public', 'finance', 'firms', 'households'];
const relationPhases = ['policy', 'credit', 'income', 'demand', 'feedback'];
const baseColor = new Color('#a8bfd1');
const signalColor = new Color('#e5ddbe');

function makeEconomy(compact) {
  const perSector = compact ? 7 : 14;
  const centers = compact
    ? [[-70, 135, -12], [80, 110, 18], [-80, -115, 14], [70, -165, -12]]
    : [[-245, 130, -22], [250, 95, 20], [-220, -155, 25], [235, -180, -24]];
  const nodes = [], links = [];
  sectors.forEach((sector, group) => {
    const center = centers[group];
    for (let index = 0; index < perSector; index++) {
      const angle = index * 2.399963 + group * .7;
      const radius = index === 0 ? 0 : (compact ? 18 : 26) + Math.sqrt(index) * (compact ? 14 : 19);
      const x = center[0] + Math.cos(angle) * radius;
      const y = center[1] + Math.sin(angle) * radius * .8;
      const z = center[2] + Math.sin(angle * 1.7) * 33;
      nodes.push({ id: `${sector}-${index}`, sector, group, index, base: [x, y, z], x, y, z, fx: x, fy: y, fz: z, phase: angle });

    }
    const members = nodes.filter(node => node.sector === sector);
    members.forEach((node, index) => {
      if (!index) return;
      const neighbors = members.slice(0, index).sort((a, b) => Math.hypot(a.x - node.x, a.y - node.y) - Math.hypot(b.x - node.x, b.y - node.y));
      links.push({ source: neighbors[0].id, target: node.id, kind: 'local', stage: -1 });
      if (index % 4 === 0 && neighbors[1]) links.push({ source: neighbors[1].id, target: node.id, kind: 'local', stage: -1 });
    });
  });
  const authored = [
    ['public', 'finance', 'policy'],
    ['finance', 'firms', 'credit'],
    ['firms', 'households', 'income'],
    ['households', 'firms', 'demand'],
    ['firms', 'finance', 'feedback'],
    ['households', 'public', 'feedback'],
  ];
  authored.forEach(([from, to, kind]) => {
    for (let index = 0; index < (compact ? 2 : 3); index++) {
      links.push({ source: `${from}-${index * 2}`, target: `${to}-${index * 2 + 1}`, kind, stage: relationPhases.indexOf(kind) });
    }
  });
  return { nodes, links };
}

export function createEconomicScene(host, panel) {
  const compact = window.innerWidth <= 900;
  const data = makeEconomy(compact);
  const nodeObjects = new Map();
  const geometry = [new OctahedronGeometry(1.5), new IcosahedronGeometry(1.4, 1), new BoxGeometry(2, 2, 2), new SphereGeometry(1.25, 8, 6)];
  let graph, active = false, disposed = false, contextLost = false, contextLostCallback = () => {};
  let elapsed = 0, lastTick = 0, lastStep = -1, lastBurst = -1, lastVisualUpdate = 0;
  const cycleSeconds = 28;
  let view = { width: 1, height: 1, distance: 700 };
  try {
    graph = new ForceGraph3D(host, { controlType: 'orbit', rendererConfig: { alpha: true, antialias: !compact, powerPreference: 'low-power' } })
      .backgroundColor('rgba(0,0,0,0)')
      .showNavInfo(false)
      .enablePointerInteraction(false)
      .enableNodeDrag(false)
      .enableNavigationControls(false)
      .nodeLabel('')
      .linkLabel('')
      .nodeThreeObject(node => {
        const object = new Group();
        const material = new MeshBasicMaterial({ color: baseColor, transparent: true, opacity: node.index === 0 ? .8 : .52, depthWrite: false });
        const mesh = new Mesh(geometry[node.group], material);
        if (node.index === 0) mesh.scale.setScalar(1.8);
        const halo = new Mesh(new SphereGeometry(node.index === 0 ? 6 : 3.5, 12, 8), new MeshBasicMaterial({ color: baseColor, transparent: true, opacity: .045, depthWrite: false }));
        object.add(mesh, halo);
        nodeObjects.set(node.id, { object, mesh, halo, material });
        return object;
      })
      .linkWidth(0)
      .linkColor(link => link.kind === 'local' ? '#a0b6ca' : '#b7c4ce')
      .linkOpacity(.32)
      .linkCurvature(link => link.kind === 'local' ? .04 : .22)
      .linkCurveRotation(link => link.stage % 2 ? .7 : -.7)
      .linkDirectionalParticles(0)
      .linkDirectionalParticleWidth(compact ? 1 : 1.3)
      .linkDirectionalParticleResolution(5)
      .linkDirectionalParticleColor('#e5ddbe')
      .linkDirectionalParticleSpeed(.004)
      .cooldownTicks(Infinity)
      .cooldownTime(Infinity)
      .d3AlphaDecay(0)
      .d3Force('charge', null)
      .d3Force('center', null)
      .onEngineTick(update)
      .graphData(data);
    graph.pauseAnimation();
    graph.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.5));
    graph.renderer().setClearColor(0, 0);
    graph.camera().fov = 48;
    graph.camera().updateProjectionMatrix();
    graph.controls().enabled = false;
    host.querySelector('canvas')?.setAttribute('aria-hidden', 'true');
  } catch (error) {
    graph?._destructor();
    host.replaceChildren();
    throw error;
  }

  function resize() {
    const width = panel.clientWidth, height = panel.clientHeight;
    if (!width || !height || disposed) return;
    view = { width, height, distance: compact ? 410 : Math.max(650, 430 / (width / height)) };
    graph.width(width).height(height);
    positionCamera();
  }
  function positionCamera() {
    const drift = elapsed * .065;
    graph.cameraPosition({ x: Math.sin(drift) * (compact ? 13 : 32), y: Math.cos(drift * .65) * 9 - 10, z: view.distance + Math.sin(drift * .6) * 14 }, { x: 0, y: -12, z: 0 });
  }
  function update() {
    if (!active || disposed || contextLost) return;
    const now = performance.now();
    elapsed += lastTick ? Math.min((now - lastTick) / 1000, .1) : 0;
    lastTick = now;
    // The graph renderer retains continuous signal motion; geometry/color work
    // is limited to 30 Hz on compact displays and 45 Hz on desktop.
    if (now - lastVisualUpdate < (compact ? 1000 / 30 : 1000 / 45)) return;
    lastVisualUpdate = now;
    const stageTime = (elapsed % cycleSeconds) / 4.6;
    const stage = Math.floor(stageTime);
    const envelope = stage < 5 ? Math.sin((stageTime - stage) * Math.PI) : 0;
    const targetSector = ['finance', 'firms', 'households', 'firms', 'public'][stage];
    for (const node of data.nodes) {
      const amount = node.index === 0 ? 2 : 5;
      node.fx = node.base[0] + Math.sin(elapsed * .24 + node.phase) * amount;
      node.fy = node.base[1] + Math.cos(elapsed * .2 + node.phase) * amount;
      node.fz = node.base[2] + Math.sin(elapsed * .18 + node.phase) * 7;
      const visual = nodeObjects.get(node.id);
      if (visual) {
        const excitation = node.sector === targetSector ? envelope : 0;
        visual.material.color.copy(baseColor).lerp(signalColor, excitation * .48);
        visual.material.opacity = (node.index === 0 ? .8 : .52) + excitation * .12;
        visual.halo.material.opacity = .045 + excitation * .04;
        visual.mesh.rotation.y = elapsed * .08 + node.phase;
      }
    }
    const absoluteStep = Math.floor(elapsed / cycleSeconds) * 6 + stage;
    const burst = Math.floor(elapsed / 1.7);
    if (absoluteStep !== lastStep || burst !== lastBurst) {
      lastStep = absoluteStep;
      lastBurst = burst;
      if (stage < 5) data.links.filter(link => link.stage === stage).forEach(link => graph.emitParticle(link));
    }
    positionCamera();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(panel);
  resize();
  const canvas = graph.renderer().domElement;
  const loseContext = event => {
    event.preventDefault();
    contextLost = true;
    graph.pauseAnimation();
    contextLostCallback();
  };
  canvas.addEventListener('webglcontextlost', loseContext);

  return {
    setActive(value) {
      if (disposed || contextLost) return;
      active = value;
      lastTick = 0;
      if (active) graph.resumeAnimation();
      else graph.pauseAnimation();
    },
    onContextLost(callback) { contextLostCallback = callback; },
    destroy() {
      if (disposed) return;
      disposed = true;
      active = false;
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', loseContext);
      graph._destructor();
      geometry.forEach(g => g.dispose());
      nodeObjects.forEach(({ material, halo }) => { material.dispose(); halo.material.dispose(); halo.geometry.dispose(); });
      host.replaceChildren();
    },
  };
}
