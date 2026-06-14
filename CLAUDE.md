# YouTube Manager for Parents

Chrome extension (Manifest V3) that helps parents bulk-clean a child's YouTube account and steer it toward better content. Four popup tabs: Clean Up Recommendations, Clean Up Subscriptions, Clean Up History, Good for Kids.

- Repo: https://github.com/ObscureAintSecure/youtube-manager-for-parents (public)
- Published to the Chrome Web Store as unlisted (resubmitted 2026-06-14 as v2.2.2)
- No build step. Plain HTML/CSS/JS: `popup.html`, `popup.css`, `popup.js`, `manifest.json`, `lists/`, `icons/`

## Rules

| File | Topic |
|------|-------|
| `.claude/rules/youtube-dom.md` | YouTube page selectors, component migrations, how to verify them live |
| `.claude/rules/architecture.md` | Batch execution model, list sync, channel-suggestion pipeline |
| `.claude/rules/build-and-publish.md` | Packaging, store submission, account/permission constraints |

## Conventions

- All channel matching is exact (name or @handle, case-insensitive) — no partial/keyword matching for flagging, to avoid false positives on destructive actions
- Commit messages: Conventional Commits, end with the Co-Authored-By trailer
- Bump `version` in both `manifest.json` and the `popup.html` footer together on release
