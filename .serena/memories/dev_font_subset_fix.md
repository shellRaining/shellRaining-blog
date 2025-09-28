## Dev font subset handling
- We debugged a VitePress dev/preview discrepancy: fonts loaded in preview but 404’d in dev because `fontPlugin` only emitted subsetted fonts during build.
- Solution: cache subset buffers in dev and add `configureServer` middleware to serve them directly, while keeping `emitFile` for builds.
- Relevant code: `packages/theme/src/node/plugins/font.ts` — new `devSubsetAssets` map, cache clearing on config changes, middleware returning `font/woff2`.
- Verified at http://localhost:5173/ that `document.fonts.check("LXGWWenKaiGBScreen")` is true and the font preload resolves.
