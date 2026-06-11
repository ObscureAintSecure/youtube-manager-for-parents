# YouTube Manager for Parents

A Chrome extension to help parents manage their children's YouTube experience. Bulk unsubscribe from gaming channels and block them from recommendations.

(Formerly "YouTube Kids Manager".)

## Features

### Subscriptions Mode
- **Load all subscriptions** from any YouTube account
- **Gaming channel detection** using keyword matching + curated list of 600+ channels
- **Search and filter** channels by name
- **Bulk select/deselect** channels
- **One-click unsubscribe** from selected channels

### Recommendations Mode (NEW)
- **Scan YouTube homepage** for gaming videos
- **Auto-detect gaming channels** in recommendations
- **Block channels from recommendations** using YouTube's "Don't recommend channel" feature
- **Undo available** via myactivity.google.com → Other activity → YouTube "Not interested" feedback

### General
- **Progress tracking** with ability to stop mid-process
- **Survives popup close** - bulk actions run in the page; closing the popup doesn't stop them. Reopen the popup to see progress.
- **Per-channel results** - failed channels are listed by name with a reason
- **Auto-scroll on load** - Load Subscriptions scrolls the page automatically to capture every subscription, not just the visible ones
- **Parent-friendly interface** - simple tabs, clear actions

## Installation

### From Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `youtube-kids-manager` folder
6. The extension icon should appear in your toolbar

## Usage

### Unsubscribing from Channels

1. **Log into your child's YouTube account** in Chrome
2. Go to YouTube's subscription page: `https://www.youtube.com/feed/channels`
3. **Click the extension icon** in your toolbar
4. Make sure **Subscriptions** tab is selected
5. Click **Load Subscriptions**
6. Use the tools to select channels:
   - **Detect Gaming** - auto-selects gaming channels
   - **Search** - filter by name
   - **All / None** - bulk selection
7. Click **Unsubscribe Selected**

### Blocking Channels from Recommendations

1. **Log into your child's YouTube account** in Chrome
2. Go to YouTube homepage: `https://www.youtube.com`
3. **Scroll down** to load more video recommendations
4. **Click the extension icon** in your toolbar
5. Select the **Recommendations** tab
6. Click **Scan Homepage for Gaming**
7. Review detected channels (uncheck any you want to keep)
8. Click **Block Selected Channels**

### Undoing Blocked Recommendations

To undo "Don't recommend channel" for all channels:
1. Go to https://myactivity.google.com
2. Click "Other Google activity" in the left menu
3. Find "YouTube 'Not interested' feedback"
4. Click "Delete"

Note: This resets ALL your "don't recommend" choices, not individual ones.

## Channel Lists

Detection is list-based only. A channel is flagged when its name or @handle exactly matches an entry in `lists/gaming-channels.txt` or `lists/misc-channels.txt` (case-insensitive). There is no keyword or partial matching - this avoids false positives on a destructive action.

Edit `lists/gaming-channels.txt` to add known gaming channels:

```
# Add one channel name or @handle per line (without the @)
pewdiepie
markiplier
```

The list supports:
- One channel name or handle per line
- Case-insensitive exact matching
- Comments starting with `#`

## Customizing the Gaming List

To add more channels to the gaming detection:

1. Open `lists/gaming-channels.txt`
2. Add channel names, one per line
3. Save the file
4. Reload the extension in `chrome://extensions/`

### Future: Remote List Updates

You can host the `gaming-channels.txt` file on GitHub and modify the extension to fetch updates. This allows maintaining a community-curated list.

## Project Structure

```
youtube-kids-manager/
├── manifest.json          # Chrome extension manifest
├── popup.html             # Extension popup UI
├── popup.css              # Styles
├── popup.js               # Main logic
├── lists/
│   └── gaming-channels.txt  # Curated gaming channels
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Troubleshooting

### "No subscriptions found"
- Make sure you're on `youtube.com/feed/channels`
- Make sure you're logged into the correct YouTube account
- Try refreshing the YouTube page

### Unsubscribe not working
- YouTube may have changed their UI
- Try refreshing the page and running again
- Check the browser console for errors

### Extension not detecting gaming channels
- Add the channel name to `lists/gaming-channels.txt`
- Check for typos in the channel name

## Privacy & Security

- **No data collection** - Everything runs locally
- **No external requests** - The extension only interacts with YouTube
- **No authentication required** - Uses your existing YouTube session
- **Open source** - Review the code yourself

## Disclaimer

- This tool performs real unsubscribe actions that **cannot be undone**
- Always double-check your selections before unsubscribing
- YouTube's UI may change, which could affect functionality
- Use at your own risk

## License

MIT License - Feel free to modify and distribute.

## Contributing

1. Fork the repository
2. Add new gaming channels to the list
3. Submit a pull request

Suggestions for gaming channels to add are welcome!
