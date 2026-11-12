# Loka website

Loka Labs' public website, built as a static multi-page site with Vite. The pages use HTML, CSS, and JavaScript; there is no React application.

## Local development

Use Node.js 22.12 or later in the Node 22 release line (or a newer supported release).

```sh
npm ci
npm run dev
```

Vite serves the site at `http://localhost:5174` by default. Follow the URL printed by Vite if that port is already occupied.

```sh
npm run build
npm run preview
```

The production build is written to `dist/`. The preview command serves that build locally. Both development and preview resolve the extensionless page URLs below.

## Pages and assets

- `/` — homepage: original brand opening, simulation introduction, Use Cases, Architecture, Team, Why it matters, and contact CTA. The original gradients, grain, WebGL visuals, typography, and desktop panel transitions are preserved; mobile sections can expand to fit their content.
- `/blog` — the nine research publications migrated from the homepage.
- `/careers` — open roles.
- `/careers/head-of-narrative` and `/careers/ml-researcher` — role details and applications.

Page entry points are listed in `vite.config.js`. Static assets live in `public/`; Vite copies them into `dist/`. `vercel.json` retains the existing clean-URL settings. `api/apply.js` is the existing application endpoint and is not executed by the static Vite preview server.

The simulation introduction uses a transparent, scene-local 3D network built with pinned `3d-force-graph` and Three.js modules. Authored public-sector, finance, firm and household relations support a repeating conceptual sequence of policy → credit → income → demand → feedback. Small signals and restrained spatial movement make the network an atmospheric background; it does not present measured economic output. Its modules are loaded near the section, paused offscreen or when the document is hidden, and replaced by a static SVG for reduced motion or rendering failure. The original global Three.js r128 and existing brand scenes remain separate. The original library attribution is retained in `public/3d-force-graph-LICENSE.txt`; `public/THIRD_PARTY_NOTICES.txt` accompanies the distributed runtime bundle with its dependencies’ license texts. The Vite plugin scopes global-Three isolation to the three graph packages in both development and production.

## Current content decisions

- Use Cases points to the homepage section at `/#use-cases`.
- Blog links now open `/blog`; the original research titles, metadata, and destination URLs are retained.
- GitHub links to the confirmed Loka organization at `https://github.com/loka-inc` (currently no public repositories). The unconfirmed X social link remains hidden. LinkedIn uses the public company page at `https://www.linkedin.com/company/113464383/`.
- The two Explore LokaWorld buttons temporarily use the verified live entry point at `https://lokaworld.vercel.app/`, retaining their original beta styling. The custom domain `world.loka.inc` still returns 404; its domain binding has not been restored, and the source of the current live deployment has not been located. The other pilot contact controls remain available.
- The healthcare question retains `±30%` from the supplied revision document, pending comparison with the original one-pager artwork.

The contact and application forms retain their existing delivery integrations. Local visual checks should not submit real inquiries or applications.
