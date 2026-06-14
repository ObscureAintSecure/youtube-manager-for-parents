# Architecture: batch execution, list sync, suggestion pipeline

## Batch execution model

Bulk actions (unsubscribe, block, history-remove) run as an injected in-page driver via `chrome.scripting.executeScript`, not from the popup loop. The driver loops in the page and reports progress through `chrome.storage.local` (`ykm_progress`, `ykm_stop`). This makes batches survive the popup closing; reopening the popup reattaches via `watchProgress()`. On open, only a batch with `state === 'running'` reattaches; finished/stopped state is cleared so the popup defaults to the Recommendations tab.

Driver pattern: `pollFor(fn, timeout)` instead of fixed `setTimeout` waits; verify each action took effect (button flipped / row gone) before counting success; per-item result `{name, ok, reason}` surfaced in the results panel.

EXCEPTION: subscribe (Good for Kids) cannot use this model — it must navigate a tab to each channel page, so it's orchestrated from the popup in a background tab and the popup must stay open. It does not survive popup close.

Pages lazy-load: scrape functions auto-scroll until the item count stabilizes, capped (subscriptions full; homepage/history capped ~300-400 items / 8-10 rounds) so an infinite feed doesn't loop forever.

## Lists (single source of truth = GitHub)

Three lists in `lists/`: `gaming-channels.txt`, `misc-channels.txt`, `recommended-channels.txt`. The extension fetches them from `raw.githubusercontent.com/.../main/lists/` on every popup open, caching in `chrome.storage.local` (`ykm_lists`) with the bundled .txt as last-resort seed. Lists are read-only in the UI (View Lists panel: counts + GitHub links).

GOTCHA: `cache: 'no-cache'` does NOT bypass GitHub's raw CDN edge cache (~5 min). Append a unique query param (`?_=${Date.now()}`) to force a fresh copy on refresh.

## Channel-suggestion pipeline (community contributions, maintainer-gated)

1. User selects channels, clicks a Suggest button → opens a prefilled GitHub issue (`openSuggestionIssue(picked, target)` where target = gaming | misc | recommended). Already-listed channels are filtered out client-side.
2. Maintainer adds the `approved` label.
3. `.github/workflows/process-suggestion.yml` parses the issue, appends new entries to the target list file (deduped, sorted via the same logic as `sort-lists.mjs`), commits with `closes #N`, comments, closes.
4. All installs pick up the change on next popup refresh.

CI gotchas already fixed: serialize runs with a `concurrency` group + `git pull --rebase` before push (two approvals raced); only close the issue if still open (the `closes #N` commit usually closes it, redundant PATCH 422s).
