# hono v4.13.12

Source: [honojs/hono](https://github.com/honojs/hono) `v4.13.11...v4.13.12`
Official release: https://github.com/honojs/hono/releases/tag/v4.13.12

## Highlights
- fix(build): keep internal types private in bundled d.ts and avoid a self-referencing JSX.IntrinsicElements (#5485)
- test(build): type-check the bundled declarations from a consumer project (#5486)
- fix(etag): correctly match mixed-case header name in retainedHeader option (#5475)
- fix(jsx): add px to numeric gridGap, gridRowGap and gridColumnGap (#5487)

## Fixes
- fix(build): keep internal types private in bundled d.ts and avoid a self-referencing JSX.IntrinsicElements (#5485)
- fix(etag): correctly match mixed-case header name in retainedHeader option (#5475)
- fix(jsx): add px to numeric gridGap, gridRowGap and gridColumnGap (#5487)
- fix(combine): return a Response from a short-circuiting middleware in some() (#5391)

## Chores
- test(build): type-check the bundled declarations from a consumer project (#5486)
- chore(deps): upgrade vite-plus to 1.0.0 (#5464)

## Other
- 4.13.12 (6abd35b)

## Stats
- Commits: 7
- Files: 25
- Diff: +303 / -82
- Pull requests: 9

