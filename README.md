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

## Deployment verification

The website's Vercel checks link to the `loka-labs / loka-website` project. Build with `npm run build` and publish the `dist/` directory. After merging a PR into `main`, confirm that Vercel reports a successful Production deployment for the resulting commit and check the live homepage and `/blog`; a merged PR alone does not confirm that the site is live. LokaWorld is a separate application and deployment.

## Pages and assets

- `/` — homepage: original brand opening, simulation introduction, Use Cases, Architecture, Team, Why it matters, and contact CTA. The original gradients, grain, WebGL visuals, typography, and desktop panel transitions are preserved. Use Cases expands in document flow at every screen size; mobile reading sections can also grow to fit their content.
- `/blog` — the nine research publications migrated from the homepage.
- `/careers` — open roles.
- `/careers/head-of-narrative` and `/careers/ml-researcher` — role details and applications.

Page entry points are listed in `vite.config.js`. Static assets live in `public/`; Vite copies them into `dist/`. `vercel.json` retains the existing clean-URL settings. `api/apply.js` is the existing application endpoint and is not executed by the static Vite preview server.

The simulation introduction uses a transparent, scene-local 3D network built with pinned `3d-force-graph` and Three.js modules. Authored public-sector, finance, firm and household relations support a repeating conceptual sequence of policy → credit → income → demand → feedback. Small signals and restrained spatial movement make the network an atmospheric background; it does not present measured economic output. Its modules are preloaded near the section, but rendering requires a positive visible intersection. It pauses offscreen or when the document is hidden, and uses a static SVG for reduced motion or rendering failure. The original global Three.js r128 and existing brand scenes remain separate. Those legacy scenes also pause when invisible or the document is hidden; reduced motion draws a still frame only when the viewport or layout changes. The original library attribution is retained in `public/3d-force-graph-LICENSE.txt`; `public/THIRD_PARTY_NOTICES.txt` accompanies the distributed runtime bundle with its dependencies’ license texts. The Vite plugin scopes global-Three isolation to the three graph packages in both development and production.

## Current content decisions

- Use Cases points to the third homepage section at `/#use-cases`. Each card shows its photograph and original question, with a keyboard-accessible native disclosure for the complete explanation, chart, and institution list. Larger labels and a dark reading surface keep the details legible; expansion uses page scrolling without an internal scrollbar. Photo credits and license links are recorded in `public/use-cases/SOURCES.md`.
- The energy curves have schematic A/B/C labels and line styles, with no numerical vertical scale or claim of measured model output. The housing example preserves the supplied figures and explicitly notes that its rate direction and baseline assumptions are unspecified; it is not a validated forecast for either direction of a 200 bp change.
- Blog links now open `/blog`; the original research titles, metadata, and destination URLs are retained. Previously shared `/#research` links redirect to `/blog`, preserving query parameters.
- GitHub links to the confirmed Loka organization at `https://github.com/loka-inc` (currently no public repositories). The unconfirmed X social link remains hidden. LinkedIn uses the public company page at `https://www.linkedin.com/company/113464383/`.
- The two Explore LokaWorld buttons temporarily use the verified live entry point at `https://lokaworld.vercel.app/`, retaining their original beta styling. The custom domain `world.loka.inc` still returns `404 DEPLOYMENT_NOT_FOUND` (checked November 18, 2026). The supplied deployment source repository is [`loka-inc/loka-world`](https://github.com/loka-inc/loka-world); it contains the application and Vite/Vercel configuration. The current Vercel browser account shows only its personal project, not the LokaWorld project. Restoring the domain requires access to the project currently serving `lokaworld.vercel.app`: add or repair `world.loka.inc` in that project's Settings → Domains and follow its generated DNS instructions. This is separate from the main website project and cannot be fixed by merging this website branch alone. The other pilot contact controls remain available.
- The healthcare question uses `a 30% increase`, matching the original one-pager image supplied on November 17, 2026. The accompanying chart retains `+30% Demand`; the earlier transcription's `±30%` has been corrected.

The contact and application forms retain their existing delivery integrations. Local visual checks should not submit real inquiries or applications.
