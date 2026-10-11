# Hono v4.13.12

Source: [honojs/hono](https://github.com/honojs/hono) `v4.13.11...v4.13.12`
Official release: https://github.com/honojs/hono/releases/tag/v4.13.12

## Highlights
- Fixed internal types visibility in bundled declarations to avoid self-referencing JSX.IntrinsicElements (PR #5485)
- Fixed ETag middleware to correctly match mixed-case header names in retainedHeader option (PR #5475)
- Fixed JSX to properly add px unit to numeric gridGap, gridRowGap and gridColumnGap values (PR #5487)
- Fixed combine middleware to return Response from short-circuiting middleware in some() (PR #5391)

## Fixes
- Keep internal types private in bundled d.ts and avoid a self-referencing JSX.IntrinsicElements (PR #5485)
- Correctly match mixed-case header name in retainedHeader option for ETag middleware (PR #5475)
- Add px to numeric gridGap, gridRowGap and gridColumnGap in JSX (PR #5487)
- Return a Response from a short-circuiting middleware in some() combinator (PR #5391)

## Testing
- Type-check the bundled declarations from a consumer project (PR #5486)

## Dependencies
- Upgrade vite-plus to 1.0.0 (PR #5464)

## Stats
- Commits: 7
- Files: 25
- Diff: +303 / -82
- Pull requests: 9

