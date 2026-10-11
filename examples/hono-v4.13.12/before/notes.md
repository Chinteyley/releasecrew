# v4.13.12

Source: [honojs/hono](https://github.com/honojs/hono) `v4.13.11...v4.13.12`
Official release: https://github.com/honojs/hono/releases/tag/v4.13.12

## Highlights
- Fixed bundled type declarations to keep internal types private and avoid self-referencing JSX.IntrinsicElements (#5485)
- Fixed etag middleware to correctly match mixed-case header names in retainedHeader option (#5475)
- Fixed JSX to add px units to numeric gridGap, gridRowGap and gridColumnGap properties (#5487)
- Fixed combine middleware to properly return Response from short-circuiting middleware in some() (#5391)

## Build
- Keep internal types private in bundled d.ts and avoid a self-referencing JSX.IntrinsicElements (#5485)
- Type-check the bundled declarations from a consumer project (#5486)

## Fixes
- Correctly match mixed-case header name in retainedHeader option for etag middleware (#5475)
- Add px to numeric gridGap, gridRowGap and gridColumnGap in JSX (#5487)
- Return a Response from a short-circuiting middleware in some() (#5391)

## Dependencies
- Upgrade vite-plus to 1.0.0 (#5464)

## Stats
- Commits: 7
- Files: 25
- Diff: +303 / -82
- Pull requests: 9

