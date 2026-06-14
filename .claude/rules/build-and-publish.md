# Build, package, and publish

## Packaging for the Chrome Web Store

No build step. The store wants a ZIP of the source with `manifest.json` at the root (it rejects `.crx` uploads). Build with exactly these paths:

```
Compress-Archive -Path manifest.json,popup.html,popup.js,popup.css,icons,lists -DestinationPath <out>\youtube-manager-for-parents-v<X.Y.Z>.zip -Force
```

Build artifacts (zip, .crx, .pem) live OUTSIDE the repo in a sibling `..\youtube-kids-manager-dist\` folder. Keep them out of the loaded extension dir — a `.pem` inside the folder triggers a Chrome "you probably don't want the key file" warning on load. `dist/` is also gitignored as a backstop.

On release: bump `version` in `manifest.json` AND the `popup.html` footer together. Store version must exceed the published one.

## Local install / testing

Load unpacked from the project folder for dev. `node --check popup.js` after JS edits. Verify behavior by reloading the unpacked extension and exercising the tab; live YouTube DOM can't be tested from the automation browser (see youtube-dom.md).

## Constraints

- Target account is a Family Link SUPERVISED account → cannot grant OAuth to third-party apps, so the YouTube Data API is not usable; everything is DOM automation. Supervised profiles also block unpacked/off-store installs, which is why the store (unlisted) publish path matters.
- Permissions: `activeTab`, `scripting`, `storage`, host `https://www.youtube.com/*`. No `<all_urls>` (would hurt review). The only off-YouTube request is fetching public lists from GitHub raw.
- English UI assumed — text-based matching ("unsubscribe", "remove from watch history") breaks under other languages.

## Store listing assets

- Screenshots: 1280×800 or 640×400; padded versions in `store-assets/store-*-1280x800.png` (generated from raw popup captures via System.Drawing padding onto a #f2f2f2 canvas). Uploaded manually in the dashboard — no API access.
- Privacy policy: gist `https://gist.github.com/ObscureAintSecure/59a1e85a56e5c3f60648019f78738006` (gist URL is stable across repo renames; keep its content in sync with `PRIVACY.md`).
- Store icon: `icons/icon128.png` (uploaded separately from the package).
