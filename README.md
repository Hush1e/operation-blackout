# Operation Blackout

A five-stage cybersecurity escape game designed by Norma DePriest for immersive workforce exploration. Originally developed as a career-fair virtual escape experience.

**[Play Operation Blackout](https://hush1e.github.io/operation-blackout/)** · **[Portfolio case study](https://hush1e.github.io/experience-design.html#blackout)**

## Play

Choose untimed practice or the 10-minute challenge. Review all three emails, create a made-up practice passphrase, decode the Caesar clue, investigate a suspicious source and authorize simulated recovery. Each stage has two hints. Wrong answers explain what to reconsider. Timed mode subtracts 30 seconds and 15 integrity points per incorrect attempt; zero time or integrity ends the challenge. Pause is available throughout.

No login, API key, server or real credentials are required. Inputs remain in page memory, and a reload starts a new session. Sound is optional and off by default. The layout adapts to small screens, uses native keyboard controls and respects reduced-motion preferences.

This is a fictional introductory simulation. The Caesar cipher is a puzzle, not modern cryptography; the passphrase exercise checks length only. Completion is not a certification or a validated measure of workforce readiness.

## Develop and publish

Requires a current Node.js LTS release.

```sh
npm ci
npm run check
npm test
npm run build
npm run dev
```

Open the local address printed by the development server. Production output is in `docs/`; relative asset paths support GitHub Pages project hosting. Commit source and rebuilt `docs/` together. GitHub Pages is configured to deploy `main` → `/docs`. The checked-in production build lets visitors play without installing anything.

`src/App.tsx` contains the scenario, feedback and state reducer. `src/index.css` contains the responsive interface. `test.mjs` covers progression gates, duplicate actions, pause, failure, practice retries, hints and reset. Browser playthroughs additionally verify the rendered inputs and completion screen.

## Release improvements

- Require classification of all three emails; remove the legitimate-email shortcut.
- Handle time and integrity failure immediately and clear state on restart.
- Add untimed practice, pause, visible feedback and a five-part workplace debrief.
- Replace misleading encryption/password claims and destructive “purge” language with bounded learning explanations and recovery terminology.
- Remove unused AI/server dependencies and API-key setup. The browser application uses React and CSS, bundled locally with esbuild.

Learning outcomes have not been evaluated in a formal learner study.
