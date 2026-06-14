# YouTube DOM: selectors per page and how to verify them

YouTube changes its DOM and CSS class names regularly. Every scrape/click action depends on selectors that WILL break over time. Treat any "X not found" / silent no-op as a likely selector drift, not a logic bug.

## Page containers (verified 2026-06)

- Homepage feed: `ytd-rich-item-renderer`
- `/feed/channels` (subscriptions): `ytd-channel-renderer`
- `/feed/history`: `yt-lockup-view-model` (NOT `ytd-video-renderer`)

## Component migration (kebab-case → camelCase + view-models)

YouTube migrated many surfaces from `ytd-*` web components to lightweight view-models with camelCase classes. Expect both; query the new one first, keep the old as fallback.

- Lockup title link: `a.ytLockupMetadataViewModelTitle` (the thumbnail link `a[href*="/watch"]` comes first in DOM and only holds the duration — query the title class strictly first)
- Channel link (home): `a[href*="/@"]` (class `ytAttributedStringLink`)
- History row channel: plain text in `.yt-content-metadata-view-model-wiz__metadata-row` as `Channel • views` — split on `•`, take first. NO @handle link on history rows, so history matching is name-only.
- Dropdown menu items (3-dot / More actions): new `yt-list-item-view-model` with title span `.ytListItemViewModelTitle`; old `ytd-menu-service-item-renderer`. Match by visible text, then click the clickable container. Scope to the open menu, not the whole doc (left sidebar also has menu-item roles).
- Subscribe button (channel page): inside `yt-subscribe-button-view-model` (old: `ytd-subscribe-button-renderer`). Find the `button` by aria-label `Subscribe to…` / `Unsubscribe from…` or text `Subscribe`/`Subscribed`. Subscribed state = aria starts "unsubscribe from" or text "subscribed".
- Unsubscribe (on /feed/channels): direct button aria-label `Unsubscribe from X`; confirm dialog button text/aria `Unsubscribe`.

## Verifying selectors live

Sign-in is BLOCKED inside the chrome-devtools automation browser ("couldn't sign in… use a different browser"), so you cannot test logged-in pages there. Instead: hand the user a self-contained console probe snippet, they paste it into their normal Chrome (F12, may need to type `allow pasting`), and paste the JSON back. The snippet should `copy(JSON.stringify(out))` to clipboard. Build probes that report selector hit-counts and dump a sample element's structure before writing/fixing any action.
