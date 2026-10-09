# Vibe Prospecting Lambda source

`index.mjs` and `package.json` were recovered from the deployed `xlya-dev-users-vibe-prospecting-lambda` package in `us-east-1` on 2026-10-09. The Lambda package also contains its installed dependencies; this directory keeps the editable source files.

Long-running steps emit NDJSON `step` events when they start, every two seconds while they run, and when they finish or fail. Assistant replies emit `message_delta` chunks after each task produces its reply, followed by the existing complete `message` event and final `result`. The frontend shows task activity and the growing reply in the chat area. Business actions, persistence, and export behavior are unchanged.

The updated package was deployed on 2026-10-09. AWS reported `LastUpdateStatus: Successful` and `CodeSha256: 5iUZaHVdbKxpUG/CulTajb05u/k6iQEYD3cBQf8Q83s=`.
