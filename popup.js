// YouTube Kids Manager - Popup Script
// Helps parents manage their children's YouTube subscriptions and recommendations

// State
let channels = [];
let selectedChannels = new Set();
let foundVideos = [];
let selectedVideos = new Set();
let historyVideos = [];
let selectedHistory = new Set();
let gamingChannelsList = [];
let miscChannelsList = [];
let gamingListText = '';
let miscListText = '';
let listsFetchedAt = null;
let isRunning = false;
let currentMode = 'subscriptions';

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {};

function initElements() {
  // Tabs
  elements.tabSubscriptions = document.getElementById('tab-subscriptions');
  elements.tabRecommendations = document.getElementById('tab-recommendations');
  elements.tabHistory = document.getElementById('tab-history');
  elements.tabLists = document.getElementById('tab-lists');
  elements.subscriptionsMode = document.getElementById('subscriptions-mode');
  elements.recommendationsMode = document.getElementById('recommendations-mode');
  elements.historyMode = document.getElementById('history-mode');
  elements.listsMode = document.getElementById('lists-mode');

  // Lists mode
  elements.linkViewGaming = document.getElementById('link-view-gaming');
  elements.linkViewMisc = document.getElementById('link-view-misc');
  elements.gamingListCount = document.getElementById('gaming-list-count');
  elements.miscListCount = document.getElementById('misc-list-count');
  elements.btnRefreshLists = document.getElementById('btn-refresh-lists');
  elements.listsSyncStatus = document.getElementById('lists-sync-status');
  
  // Status
  elements.statusArea = document.getElementById('status-area');
  elements.statusMessage = document.getElementById('status-message');
  
  // Subscriptions mode
  elements.btnLoad = document.getElementById('btn-load');
  elements.filterSection = document.getElementById('filter-section');
  elements.searchInput = document.getElementById('search-input');
  elements.btnSearch = document.getElementById('btn-search');
  elements.btnSelectMatching = document.getElementById('btn-select-matching');
  elements.btnDetectGaming = document.getElementById('btn-detect-gaming');
  elements.btnSelectAll = document.getElementById('btn-select-all');
  elements.btnSelectNone = document.getElementById('btn-select-none');
  elements.bottomNInput = document.getElementById('bottom-n-input');
  elements.btnSelectBottom = document.getElementById('btn-select-bottom');
  elements.btnSuggestSubs = document.getElementById('btn-suggest-subs');
  elements.btnSuggestVideos = document.getElementById('btn-suggest-videos');
  elements.totalCount = document.getElementById('total-count');
  elements.selectedCount = document.getElementById('selected-count');
  elements.gamingCount = document.getElementById('gaming-count');
  elements.channelsSection = document.getElementById('channels-section');
  elements.channelList = document.getElementById('channel-list');
  elements.actionSection = document.getElementById('action-section');
  elements.btnUnsubscribe = document.getElementById('btn-unsubscribe');
  
  // Navigation shortcuts
  elements.btnGotoSubs = document.getElementById('btn-goto-subs');
  elements.btnGotoHome = document.getElementById('btn-goto-home');
  elements.btnGotoHistory = document.getElementById('btn-goto-history');

  // History mode
  elements.btnScanHistory = document.getElementById('btn-scan-history');
  elements.historySearchInput = document.getElementById('history-search-input');
  elements.btnHistorySearch = document.getElementById('btn-history-search');
  elements.btnSelectMatchingHistory = document.getElementById('btn-select-matching-history');
  elements.historyVideosSection = document.getElementById('history-videos-section');
  elements.historyFoundCount = document.getElementById('history-found-count');
  elements.historySelectedCount = document.getElementById('history-selected-count');
  elements.historyGamingCount = document.getElementById('history-gaming-count');
  elements.historyList = document.getElementById('history-list');
  elements.historyActionSection = document.getElementById('history-action-section');
  elements.btnRemoveHistory = document.getElementById('btn-remove-history');
  elements.btnSelectGamingHistory = document.getElementById('btn-select-gaming-history');
  elements.btnSelectAllHistory = document.getElementById('btn-select-all-history');
  elements.btnSelectNoneHistory = document.getElementById('btn-select-none-history');

  // Recommendations mode
  elements.btnScanHome = document.getElementById('btn-scan-home');
  elements.videoSearchInput = document.getElementById('video-search-input');
  elements.btnVideoSearch = document.getElementById('btn-video-search');
  elements.btnSelectMatchingVideos = document.getElementById('btn-select-matching-videos');
  elements.foundVideosSection = document.getElementById('found-videos-section');
  elements.videosFoundCount = document.getElementById('videos-found-count');
  elements.videosSelectedCount = document.getElementById('videos-selected-count');
  elements.videosGamingCount = document.getElementById('videos-gaming-count');
  elements.videoList = document.getElementById('video-list');
  elements.blockActionSection = document.getElementById('block-action-section');
  elements.btnBlockSelected = document.getElementById('btn-block-selected');
  elements.btnSelectGamingVideos = document.getElementById('btn-select-gaming-videos');
  elements.btnSelectAllVideos = document.getElementById('btn-select-all-videos');
  elements.btnSelectNoneVideos = document.getElementById('btn-select-none-videos');
  
  // Shared
  elements.progressSection = document.getElementById('progress-section');
  elements.progressFill = document.getElementById('progress-fill');
  elements.progressText = document.getElementById('progress-text');
  elements.btnStop = document.getElementById('btn-stop');
  elements.resultsSection = document.getElementById('results-section');
  elements.resultsContent = document.getElementById('results-content');
  elements.btnDone = document.getElementById('btn-done');
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  initElements();
  await loadChannelLists();
  setupEventListeners();
  switchMode('recommendations');
  refreshListsFromGitHub(); // pull latest lists in the background

  // Reattach only to a still-running batch. A finished/stopped batch's
  // leftover state is cleared so the popup always opens on Recommendations.
  const { ykm_progress } = await chrome.storage.local.get('ykm_progress');
  if (ykm_progress && ykm_progress.state === 'running') {
    if (ykm_progress.action === 'unsubscribe') switchMode('subscriptions');
    else if (ykm_progress.action === 'history') switchMode('history');
    hideAllSections();
    watchProgress();
  } else if (ykm_progress) {
    chrome.storage.local.remove(['ykm_progress', 'ykm_stop']);
  }
});

function setupEventListeners() {
  // Tab switching
  elements.tabSubscriptions.addEventListener('click', () => switchMode('subscriptions'));
  elements.tabRecommendations.addEventListener('click', () => switchMode('recommendations'));
  elements.tabHistory.addEventListener('click', () => switchMode('history'));
  elements.tabLists.addEventListener('click', () => switchMode('lists'));

  // Lists mode
  elements.btnRefreshLists.addEventListener('click', () => refreshListsFromGitHub(true));
  
  // Subscriptions mode
  elements.btnLoad.addEventListener('click', loadSubscriptions);
  elements.btnSearch.addEventListener('click', filterBySearch);
  elements.btnSelectMatching.addEventListener('click', selectMatchingChannels);
  elements.searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') filterBySearch();
  });
  elements.btnDetectGaming.addEventListener('click', detectGamingChannels);
  elements.btnSelectAll.addEventListener('click', selectAllChannels);
  elements.btnSelectNone.addEventListener('click', selectNoneChannels);
  elements.btnSelectBottom.addEventListener('click', selectBottomN);
  elements.btnSuggestSubs.addEventListener('click', () => {
    const picked = Array.from(selectedChannels)
      .map(id => channels.find(c => c.id === id))
      .filter(c => c && !c.isBlocked) // skip channels already on the lists
      .map(c => ({ name: c.name, handle: c.handle }));
    openSuggestionIssue(picked);
  });
  elements.btnSuggestVideos.addEventListener('click', () => {
    const picked = Array.from(selectedVideos)
      .map(id => foundVideos.find(v => v.id === id))
      .filter(v => v && !v.isBlocked) // skip channels already on the lists
      .map(v => ({ name: v.channelName, handle: v.channelHandle || '' }));
    openSuggestionIssue(picked);
  });
  elements.btnUnsubscribe.addEventListener('click', startUnsubscribe);
  
  // Navigation shortcuts
  elements.btnGotoSubs.addEventListener('click', () => {
    chrome.tabs.update({ url: 'https://www.youtube.com/feed/channels' });
  });
  elements.btnGotoHome.addEventListener('click', () => {
    chrome.tabs.update({ url: 'https://www.youtube.com/' });
  });
  elements.btnGotoHistory.addEventListener('click', () => {
    chrome.tabs.update({ url: 'https://www.youtube.com/feed/history' });
  });

  // History mode
  elements.btnScanHistory.addEventListener('click', scanWatchHistory);
  elements.btnHistorySearch.addEventListener('click', filterHistoryBySearch);
  elements.btnSelectMatchingHistory.addEventListener('click', selectMatchingHistory);
  elements.historySearchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') filterHistoryBySearch();
  });
  elements.btnRemoveHistory.addEventListener('click', startRemoveHistory);
  elements.btnSelectGamingHistory.addEventListener('click', selectGamingHistory);
  elements.btnSelectAllHistory.addEventListener('click', selectAllHistory);
  elements.btnSelectNoneHistory.addEventListener('click', selectNoneHistory);

  // Recommendations mode
  elements.btnScanHome.addEventListener('click', scanHomepageForGaming);
  elements.btnVideoSearch.addEventListener('click', filterVideosBySearch);
  elements.btnSelectMatchingVideos.addEventListener('click', selectMatchingVideos);
  elements.videoSearchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') filterVideosBySearch();
  });
  elements.btnBlockSelected.addEventListener('click', startBlockingChannels);
  elements.btnSelectGamingVideos.addEventListener('click', selectGamingVideos);
  elements.btnSelectAllVideos.addEventListener('click', selectAllVideos);
  elements.btnSelectNoneVideos.addEventListener('click', selectNoneVideos);
  
  // Shared
  elements.btnStop.addEventListener('click', stopProcess);
  elements.btnDone.addEventListener('click', resetUI);
}

function switchMode(mode) {
  currentMode = mode;

  // Update tabs
  elements.tabSubscriptions.classList.toggle('active', mode === 'subscriptions');
  elements.tabRecommendations.classList.toggle('active', mode === 'recommendations');
  elements.tabHistory.classList.toggle('active', mode === 'history');
  elements.tabLists.classList.toggle('active', mode === 'lists');

  // Show/hide mode sections
  elements.subscriptionsMode.classList.toggle('hidden', mode !== 'subscriptions');
  elements.recommendationsMode.classList.toggle('hidden', mode !== 'recommendations');
  elements.historyMode.classList.toggle('hidden', mode !== 'history');
  elements.listsMode.classList.toggle('hidden', mode !== 'lists');

  // Update status message and which "take me there" link shows
  elements.btnGotoSubs.classList.toggle('hidden', mode !== 'subscriptions');
  elements.btnGotoHome.classList.toggle('hidden', mode !== 'recommendations');
  elements.btnGotoHistory.classList.toggle('hidden', mode !== 'history');

  if (mode === 'subscriptions') {
    setStatus('Go to youtube.com/feed/channels and click the "Load Subscriptions" button below', 'info');
  } else if (mode === 'recommendations') {
    setStatus('Go to youtube.com homepage and click the "Scan Homepage" button below', 'info');
  } else if (mode === 'history') {
    setStatus('Go to youtube.com/feed/history and click the "Scan Watch History" button below', 'info');
  } else {
    fillListsView();
    setStatus('Lists are read-only here. Edit on GitHub, then Refresh.', 'info');
  }

  // Hide progress/results when switching
  elements.progressSection.classList.add('hidden');
  elements.resultsSection.classList.add('hidden');
}

// ============================================
// LOAD CHANNEL LISTS
// ============================================
function parseList(text) {
  return text
    .split('\n')
    .map(line => line.trim().toLowerCase())
    .filter(line => line && !line.startsWith('#'));
}

async function fetchBundledList(file) {
  try {
    const response = await fetch(chrome.runtime.getURL(`lists/${file}`));
    return response.ok ? await response.text() : '';
  } catch (error) {
    return '';
  }
}

// GitHub is the single source of truth for the lists. The extension pulls
// the latest copies on every popup open; storage holds a cache for when
// GitHub is unreachable; the bundled .txt files are the last-resort fallback.
const GITHUB_LISTS_BASE = 'https://raw.githubusercontent.com/ObscureAintSecure/youtube-kids-manager/main/lists/';

async function loadChannelLists() {
  const { ykm_lists } = await chrome.storage.local.get('ykm_lists');

  if (ykm_lists && typeof ykm_lists.gaming === 'string') {
    gamingListText = ykm_lists.gaming;
    miscListText = ykm_lists.misc || '';
    listsFetchedAt = ykm_lists.fetchedAt || null;
  } else {
    gamingListText = await fetchBundledList('gaming-channels.txt');
    miscListText = await fetchBundledList('misc-channels.txt');
    listsFetchedAt = null;
  }

  gamingChannelsList = parseList(gamingListText);
  miscChannelsList = parseList(miscListText);
}

async function refreshListsFromGitHub(manual = false) {
  elements.btnRefreshLists.disabled = true;
  if (manual) setStatus('Fetching lists from GitHub...', 'info');

  try {
    const [gamingRes, miscRes] = await Promise.all([
      fetch(GITHUB_LISTS_BASE + 'gaming-channels.txt', { cache: 'no-cache' }),
      fetch(GITHUB_LISTS_BASE + 'misc-channels.txt', { cache: 'no-cache' })
    ]);
    if (!gamingRes.ok || !miscRes.ok) {
      throw new Error(`GitHub returned ${gamingRes.ok ? miscRes.status : gamingRes.status}`);
    }

    gamingListText = await gamingRes.text();
    miscListText = await miscRes.text();
    listsFetchedAt = Date.now();
    await chrome.storage.local.set({
      ykm_lists: { gaming: gamingListText, misc: miscListText, fetchedAt: listsFetchedAt }
    });

    gamingChannelsList = parseList(gamingListText);
    miscChannelsList = parseList(miscListText);
    retagLoadedData();
    fillListsView();
    if (manual) {
      setStatus(`Synced: ${gamingChannelsList.length} gaming, ${miscChannelsList.length} misc entries`, 'success');
    }
  } catch (error) {
    fillListsView(`GitHub unreachable (${error.message})`);
    if (manual) setStatus(`Sync failed: ${error.message}. Using cached lists.`, 'error');
  } finally {
    elements.btnRefreshLists.disabled = false;
  }
}

function fillListsView(errorNote) {
  updateListCounts();
  const blobBase = 'https://github.com/ObscureAintSecure/youtube-kids-manager/blob/main/lists/';
  elements.linkViewGaming.href = blobBase + 'gaming-channels.txt';
  elements.linkViewMisc.href = blobBase + 'misc-channels.txt';
  if (errorNote) {
    const cached = listsFetchedAt ? `cached copy from ${new Date(listsFetchedAt).toLocaleString()}` : 'bundled copy';
    elements.listsSyncStatus.textContent = `${errorNote} — using ${cached}`;
  } else if (listsFetchedAt) {
    elements.listsSyncStatus.textContent = `Synced from GitHub: ${new Date(listsFetchedAt).toLocaleString()}`;
  } else {
    elements.listsSyncStatus.textContent = 'Not synced yet — using bundled lists';
  }
}

function updateListCounts() {
  elements.gamingListCount.textContent = `(${gamingChannelsList.length} entries)`;
  elements.miscListCount.textContent = `(${miscChannelsList.length} entries)`;
}

// Re-apply list matching to whatever is already loaded in either mode
function retagLoadedData() {
  if (channels.length > 0) {
    channels.forEach(ch => {
      const blockStatus = isBlockedChannel(ch);
      ch.isGaming = blockStatus.isGaming;
      ch.isMisc = blockStatus.isMisc;
      ch.isBlocked = blockStatus.isBlocked;
    });
    renderChannels();
    updateChannelCounts();
  }
  if (foundVideos.length > 0) {
    foundVideos.forEach(v => {
      const nameLower = v.channelName.toLowerCase();
      const handleLower = (v.channelHandle || '').toLowerCase();
      v.isGaming = gamingChannelsList.some(gc => nameLower === gc || handleLower === gc);
      v.isMisc = miscChannelsList.some(mc => nameLower === mc || handleLower === mc);
      v.isBlocked = v.isGaming || v.isMisc;
    });
    renderFoundVideos();
    updateVideoCounts();
  }
}

// ============================================
// CHANNEL DETECTION (LIST-BASED ONLY)
// ============================================
function isBlockedChannel(channel) {
  const nameLower = channel.name.toLowerCase();
  const handleLower = (channel.handle || '').toLowerCase();
  
  // Exact match only - channel name or handle must exactly equal a list entry
  const matchesGaming = gamingChannelsList.some(gc => 
    nameLower === gc || handleLower === gc
  );
  
  const matchesMisc = miscChannelsList.some(mc => 
    nameLower === mc || handleLower === mc
  );
  
  return {
    isBlocked: matchesGaming || matchesMisc,
    isGaming: matchesGaming,
    isMisc: matchesMisc
  };
}

// ============================================
// SUBSCRIPTIONS MODE
// ============================================
async function loadSubscriptions() {
  setStatus('Loading subscriptions (auto-scrolling to load all)...', 'info');
  elements.btnLoad.disabled = true;
  elements.btnLoad.innerHTML = '<span class="loading"></span> Loading...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('youtube.com')) {
      throw new Error('Please navigate to YouTube first');
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeSubscriptions
    });

    if (results && results[0] && results[0].result) {
      channels = results[0].result;
      
      if (channels.length === 0) {
        throw new Error('No subscriptions found. Go to youtube.com/feed/channels');
      }

      channels.forEach(ch => {
        const blockStatus = isBlockedChannel(ch);
        ch.isGaming = blockStatus.isGaming;
        ch.isMisc = blockStatus.isMisc;
        ch.isBlocked = blockStatus.isBlocked;
      });

      renderChannels();
      elements.filterSection.classList.remove('hidden');
      elements.channelsSection.classList.remove('hidden');
      elements.actionSection.classList.remove('hidden');
      updateChannelCounts();
      setStatus(`Found ${channels.length} subscriptions`, 'success');
    } else {
      throw new Error('Could not load subscriptions. Try refreshing YouTube.');
    }
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    elements.btnLoad.disabled = false;
    elements.btnLoad.innerHTML = '📋 Load Subscriptions';
  }
}

async function scrapeSubscriptions() {
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Page lazy-loads subscriptions: scroll until the count stops growing
  // so we capture all of them, not just the rendered ones.
  let lastCount = 0;
  let stableRounds = 0;
  for (let i = 0; i < 60 && stableRounds < 3; i++) {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await sleep(700);
    const count = document.querySelectorAll('ytd-channel-renderer, ytd-grid-channel-renderer').length;
    if (count === lastCount) {
      stableRounds++;
    } else {
      stableRounds = 0;
      lastCount = count;
    }
  }
  window.scrollTo(0, 0);

  const channelElements = document.querySelectorAll('ytd-channel-renderer, ytd-grid-channel-renderer');
  const channels = [];

  channelElements.forEach((el, index) => {
    // Try specific selectors in order of preference
    let name = '';
    const titleEl = el.querySelector('#channel-title #text');
    if (titleEl) {
      name = titleEl.textContent.trim();
    } else {
      const altTitleEl = el.querySelector('#channel-title');
      if (altTitleEl) {
        name = altTitleEl.textContent.trim();
      }
    }
    
    const avatarEl = el.querySelector('img#img, yt-img-shadow img');
    const linkEl = el.querySelector('a#main-link, a.channel-link');

    const descEl = el.querySelector('#description, yt-formatted-string#description');
    const description = descEl ? descEl.textContent.trim() : '';
    
    // Extract handle from URL - this is our unique identifier
    let handle = '';
    let channelUrl = '';
    if (linkEl && linkEl.href) {
      channelUrl = linkEl.href;
      const match = linkEl.href.match(/@([^\/\?]+)/);
      if (match) {
        handle = match[1];
      }
    }

    if (name && handle) {
      channels.push({
        id: index,
        name: name,
        handle: handle,  // e.g., "hiartofcrime"
        description: description,
        avatar: avatarEl ? avatarEl.src : '',
        channelUrl: channelUrl,
        isGaming: false
      });
    }
  });

  return channels;
}

function renderChannels() {
  elements.channelList.innerHTML = '';
  
  channels.forEach(channel => {
    const div = document.createElement('div');
    div.className = `channel-item ${channel.isBlocked ? 'gaming' : ''}`;
    div.dataset.id = channel.id;
    div.dataset.name = channel.name.toLowerCase();
    div.dataset.search = `${channel.name} ${channel.handle} ${channel.description || ''}`.toLowerCase();
    
    // Build tag display
    let tagHtml = '';
    if (channel.isGaming) {
      tagHtml += '<span class="channel-tag gaming">Gaming</span>';
    }
    if (channel.isMisc) {
      tagHtml += '<span class="channel-tag misc">Misc</span>';
    }
    
    div.innerHTML = `
      <input type="checkbox" class="channel-checkbox" data-id="${channel.id}"
        ${selectedChannels.has(channel.id) ? 'checked' : ''}>
      <img class="channel-avatar" alt="">
      <div class="channel-info">
        <span class="channel-name">${escapeHtml(channel.name)}</span>
        ${tagHtml}
      </div>
    `;

    // Handle image load errors without inline handler
    const img = div.querySelector('.channel-avatar');
    if (channel.avatar) img.src = channel.avatar;
    img.addEventListener('error', () => { img.style.display = 'none'; });
    
    const checkbox = div.querySelector('.channel-checkbox');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedChannels.add(channel.id);
      } else {
        selectedChannels.delete(channel.id);
      }
      updateChannelCounts();
    });
    
    div.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });
    
    elements.channelList.appendChild(div);
  });
}

function updateChannelCounts() {
  const gamingTagged = channels.filter(ch => ch.isGaming).length;
  const miscTagged = channels.filter(ch => ch.isMisc).length;

  elements.totalCount.textContent = `${channels.length} channels`;
  elements.selectedCount.textContent = `${selectedChannels.size} selected`;

  if (gamingTagged + miscTagged > 0) {
    elements.gamingCount.textContent = `${gamingTagged} gaming, ${miscTagged} misc`;
    elements.gamingCount.classList.remove('hidden');
  } else {
    elements.gamingCount.classList.add('hidden');
  }

  elements.btnUnsubscribe.textContent = `🗑️ Unsubscribe Selected (${selectedChannels.size})`;
  elements.btnUnsubscribe.disabled = selectedChannels.size === 0;

  // Only channels not already on the lists are worth suggesting
  const suggestableSubs = channels.filter(ch => selectedChannels.has(ch.id) && !ch.isBlocked).length;
  elements.btnSuggestSubs.innerHTML = `<span>💡 Suggest Selected for Shared Lists</span><span>(${suggestableSubs} new)</span>`;
  elements.btnSuggestSubs.disabled = suggestableSubs === 0;
}

function filterBySearch() {
  const query = elements.searchInput.value.toLowerCase().trim();

  document.querySelectorAll('#channel-list .channel-item').forEach(item => {
    item.classList.toggle('filtered-out', query && !item.dataset.search.includes(query));
  });
}

// Add every channel whose name, handle, or description contains the keyword
// to the current selection. Additive so multiple keyword sweeps compose.
function selectMatchingChannels() {
  const query = elements.searchInput.value.toLowerCase().trim();
  if (!query || channels.length === 0) return;

  const matches = channels.filter(ch =>
    `${ch.name} ${ch.handle} ${ch.description || ''}`.toLowerCase().includes(query)
  );
  matches.forEach(ch => selectedChannels.add(ch.id));

  document.querySelectorAll('#channel-list .channel-checkbox').forEach(cb => {
    cb.checked = selectedChannels.has(parseInt(cb.dataset.id));
  });

  updateChannelCounts();
  setStatus(`"${query}": ${matches.length} match(es) added — ${selectedChannels.size} selected total`, matches.length ? 'success' : 'info');
}

function detectGamingChannels() {
  selectedChannels.clear();
  channels.forEach(ch => {
    if (ch.isBlocked) {
      selectedChannels.add(ch.id);
    }
  });
  
  document.querySelectorAll('#channel-list .channel-checkbox').forEach(cb => {
    const id = parseInt(cb.dataset.id);
    cb.checked = selectedChannels.has(id);
  });
  
  updateChannelCounts();
  const count = channels.filter(ch => ch.isBlocked).length;
  setStatus(`Selected ${count} channels from block lists`, 'info');
}

// Select the last N channels in loaded order. When the YouTube page is
// sorted by "Most relevant", the bottom of the list is the least-watched.
function selectBottomN() {
  const n = parseInt(elements.bottomNInput.value, 10);
  if (!n || n < 1 || channels.length === 0) return;

  selectedChannels.clear();
  channels.slice(-n).forEach(ch => selectedChannels.add(ch.id));

  document.querySelectorAll('#channel-list .channel-checkbox').forEach(cb => {
    cb.checked = selectedChannels.has(parseInt(cb.dataset.id));
  });

  // Jump the popup list to the bottom so the selection is visible
  elements.channelList.scrollTop = elements.channelList.scrollHeight;

  updateChannelCounts();
  setStatus(`Selected bottom ${Math.min(n, channels.length)} of ${channels.length} channels — review before unsubscribing`, 'info');
}

function selectAllChannels() {
  document.querySelectorAll('#channel-list .channel-item:not(.filtered-out)').forEach(item => {
    selectedChannels.add(parseInt(item.dataset.id));
  });
  document.querySelectorAll('#channel-list .channel-checkbox').forEach(cb => {
    const id = parseInt(cb.dataset.id);
    cb.checked = selectedChannels.has(id);
  });
  updateChannelCounts();
}

function selectNoneChannels() {
  selectedChannels.clear();
  document.querySelectorAll('#channel-list .channel-checkbox').forEach(cb => {
    cb.checked = false;
  });
  updateChannelCounts();
}

async function startUnsubscribe() {
  if (selectedChannels.size === 0) return;

  if (!confirm(`Unsubscribe from ${selectedChannels.size} channel(s)?`)) {
    return;
  }

  const targets = Array.from(selectedChannels).map(id => {
    const ch = channels.find(c => c.id === id);
    return { handle: ch.handle, name: ch.name };
  });

  isRunning = true;
  hideAllSections();
  elements.progressSection.classList.remove('hidden');
  elements.btnStop.disabled = false;
  elements.btnStop.textContent = '⏹️ Stop';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  await chrome.storage.local.set({
    ykm_stop: false,
    ykm_progress: { action: 'unsubscribe', state: 'running', total: targets.length, done: 0, results: [] }
  });

  // Fire and forget - the batch driver runs in the page and keeps going
  // even if this popup closes. Progress flows back via chrome.storage.
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: batchUnsubscribeDriver,
    args: [targets]
  }).catch(err => setStatus(`Could not start: ${err.message}`, 'error'));

  watchProgress();
}

// Injected into the /feed/channels page. Self-contained: runs the whole
// batch in-page and reports progress through chrome.storage.local, so it
// survives the popup closing.
async function batchUnsubscribeDriver(targets) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const visible = el => el && el.offsetParent !== null;

  // Poll for a condition instead of fixed timeouts - resilient to slow loads
  async function pollFor(fn, timeout = 5000, interval = 150) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const result = fn();
      if (result) return result;
      await sleep(interval);
    }
    return null;
  }

  async function report(patch) {
    const { ykm_progress } = await chrome.storage.local.get('ykm_progress');
    await chrome.storage.local.set({ ykm_progress: { ...(ykm_progress || {}), ...patch } });
  }

  async function unsubOne(t) {
    const search = ('@' + t.handle).toLowerCase();
    const renderer = [...document.querySelectorAll('ytd-channel-renderer, ytd-grid-channel-renderer')]
      .find(el => {
        const a = el.querySelector('a#main-link, a.channel-link');
        return a && a.href && a.href.toLowerCase().includes(search);
      });
    if (!renderer) return { ok: false, reason: 'channel not found on page' };
    renderer.scrollIntoView({ behavior: 'instant', block: 'center' });

    // Primary path (current UI): direct "Unsubscribe from X" button
    let trigger = [...renderer.querySelectorAll('button')]
      .find(b => (b.getAttribute('aria-label') || '').toLowerCase().startsWith('unsubscribe'));
    let viaMenu = false;

    if (!trigger) {
      // Fallback (older UI): notification-preference dropdown holds Unsubscribe
      trigger = renderer.querySelector('#notification-preference-button button, ytd-subscription-notification-toggle-button-renderer-next button');
      viaMenu = true;
    }
    if (!trigger) return { ok: false, reason: 'no unsubscribe button found' };
    trigger.click();

    if (viaMenu) {
      const item = await pollFor(() =>
        [...document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-item, [role="menuitem"]')]
          .find(el => visible(el) && el.textContent.trim().toLowerCase() === 'unsubscribe'),
        4000);
      if (!item) { document.body.click(); return { ok: false, reason: 'menu item not found' }; }
      item.click();
    }

    // Confirmation dialog: any visible button reading "Unsubscribe" inside a dialog
    const confirmBtn = await pollFor(() => {
      const dialogs = document.querySelectorAll('yt-confirm-dialog-renderer, tp-yt-paper-dialog, [role="dialog"]');
      for (const d of dialogs) {
        const btn = [...d.querySelectorAll('button')].find(b => {
          if (!visible(b)) return false;
          const txt = (b.textContent || '').trim().toLowerCase();
          const aria = (b.getAttribute('aria-label') || '').trim().toLowerCase();
          return txt === 'unsubscribe' || aria === 'unsubscribe';
        });
        if (btn) return btn;
      }
      return null;
    }, 4000);
    if (!confirmBtn) { document.body.click(); return { ok: false, reason: 'confirm dialog not found' }; }
    confirmBtn.click();

    // Verify: a plain "Subscribe" button appears in this renderer
    const verified = await pollFor(() => {
      const flipped = [...renderer.querySelectorAll('button')].some(b => {
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        const txt = (b.textContent || '').trim().toLowerCase();
        return aria.startsWith('subscribe to') || txt === 'subscribe';
      });
      return flipped || null;
    }, 4000);

    return verified ? { ok: true, reason: '' } : { ok: false, reason: 'clicked but could not verify' };
  }

  const results = [];
  for (let i = 0; i < targets.length; i++) {
    const { ykm_stop } = await chrome.storage.local.get('ykm_stop');
    if (ykm_stop) {
      await report({ state: 'stopped', results });
      return results;
    }

    const t = targets[i];
    await report({ done: i, current: t.name });

    let outcome;
    try {
      outcome = await unsubOne(t);
    } catch (e) {
      outcome = { ok: false, reason: e.message };
    }
    results.push({ name: t.name, ok: outcome.ok, reason: outcome.reason });
    await report({ done: i + 1, results });
    await sleep(800);
  }

  await report({ state: 'finished', done: targets.length, results });
  return results;
}

// ============================================
// RECOMMENDATIONS MODE
// ============================================
async function scanHomepageForGaming() {
  setStatus('Scanning homepage (auto-scrolling to load more)...', 'info');
  elements.btnScanHome.disabled = true;
  elements.btnScanHome.innerHTML = '<span class="loading"></span> Scanning...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('youtube.com')) {
      throw new Error('Please navigate to YouTube first');
    }

    // First, pass the channel lists to the page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scanHomePageVideos,
      args: [gamingChannelsList, miscChannelsList]
    });

    if (results && results[0] && results[0].result) {
      foundVideos = results[0].result;
      
      if (foundVideos.length === 0) {
        setStatus('No videos found. Make sure you\'re on the YouTube homepage, then scan again.', 'info');
        elements.foundVideosSection.classList.add('hidden');
        elements.blockActionSection.classList.add('hidden');
      } else {
        // Auto-select only channels that match the lists
        const blockedVideos = foundVideos.filter(v => v.isBlocked);
        selectedVideos = new Set(blockedVideos.map(v => v.id));
        renderFoundVideos();
        elements.foundVideosSection.classList.remove('hidden');
        elements.blockActionSection.classList.remove('hidden');
        updateVideoCounts();
        setStatus(`Found ${foundVideos.length} channels (${blockedVideos.length} on block lists)`, 'success');
      }
    } else {
      throw new Error('Could not scan page. Make sure you\'re on YouTube homepage.');
    }
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    elements.btnScanHome.disabled = false;
    elements.btnScanHome.innerHTML = '🔍 Scan Homepage';
  }
}

async function scanHomePageVideos(gamingList, miscList) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Homepage is an infinite feed, so auto-scroll with a cap: stop when
  // tiles stop appearing, we have plenty, or we hit the round limit.
  let lastCount = 0;
  let stableRounds = 0;
  for (let i = 0; i < 8 && stableRounds < 2; i++) {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await sleep(900);
    const count = document.querySelectorAll('ytd-rich-item-renderer').length;
    if (count >= 300) break;
    if (count === lastCount) {
      stableRounds++;
    } else {
      stableRounds = 0;
      lastCount = count;
    }
  }
  window.scrollTo(0, 0);

  const videoElements = document.querySelectorAll('ytd-rich-item-renderer');
  const channelMap = new Map(); // channelKey -> channel data

  videoElements.forEach((el) => {
    // Skip Mix/playlist collections (old kebab-case and current camelCase schemes)
    if (el.querySelector('[class*="CollectionStack"], .yt-lockup-view-model--collection-stack-2')) {
      return;
    }

    let channelName = '';
    let channelHandle = '';

    // Find a link that goes to a channel page (contains /@), skipping video links
    const allChannelLinks = el.querySelectorAll('a[href*="/@"]');
    for (const link of allChannelLinks) {
      const href = link.getAttribute('href') || '';
      if (href.includes('/watch')) continue;

      const hrefMatch = href.match(/@([^\/\?]+)/);
      if (hrefMatch) {
        channelHandle = hrefMatch[1];
        // Channel name from link text, minus verification badge / icon markup
        const clone = link.cloneNode(true);
        clone.querySelectorAll('svg, [class*="IconWrapper"], span.yt-core-attributed-string--inline-block-mod').forEach(s => s.remove());
        channelName = clone.textContent.trim();
        break;
      }
    }

    if (!channelName && !channelHandle) return;

    const titleEl = el.querySelector('a.ytLockupMetadataViewModelTitle, a.yt-lockup-metadata-view-model__title, #video-title, #video-title-link');
    const videoTitle = titleEl ? titleEl.textContent.trim() : '';

    const thumbEl = el.querySelector('.ytSpecAvatarShapeImage, .yt-spec-avatar-shape img, .yt-spec-avatar-shape__image');
    const thumbnail = thumbEl ? thumbEl.src : '';

    // Exact match only - channel name or handle must exactly equal a list entry
    const channelLower = channelName.toLowerCase();
    const handleLower = channelHandle.toLowerCase();
    const isGamingChannel = gamingList.some(gc => channelLower === gc || handleLower === gc);
    const isMiscChannel = miscList.some(mc => channelLower === mc || handleLower === mc);

    // Use handle as key if available, otherwise channel name
    const channelKey = (channelHandle || channelName).toLowerCase();

    if (!channelMap.has(channelKey)) {
      channelMap.set(channelKey, {
        channelName: channelName,
        channelHandle: channelHandle,
        videoTitle: videoTitle,
        thumbnail: thumbnail,
        isGaming: isGamingChannel,
        isMisc: isMiscChannel,
        isBlocked: isGamingChannel || isMiscChannel,
        videoCount: 1
      });
    } else {
      channelMap.get(channelKey).videoCount++;
    }
  });

  const videos = [];
  let id = 0;
  channelMap.forEach((data) => {
    videos.push({ id: id++, ...data });
  });

  return videos;
}

function renderFoundVideos() {
  elements.videoList.innerHTML = '';
  
  foundVideos.forEach(video => {
    const div = document.createElement('div');
    div.className = `channel-item${video.isBlocked ? ' gaming' : ''}`;
    div.dataset.id = video.id;
    div.dataset.search = `${video.channelName} ${video.channelHandle || ''} ${video.videoTitle || ''}`.toLowerCase();
    
    const handleDisplay = video.channelHandle ? ` (@${video.channelHandle})` : '';
    const countDisplay = video.videoCount > 1 ? ` <span class="video-count">(${video.videoCount} videos)</span>` : '';
    
    // Build tag display
    let tagHtml = '';
    if (video.isGaming) {
      tagHtml += '<span class="channel-tag gaming">Gaming</span>';
    }
    if (video.isMisc) {
      tagHtml += '<span class="channel-tag misc">Misc</span>';
    }
    
    div.innerHTML = `
      <input type="checkbox" class="channel-checkbox" data-id="${video.id}"
        ${selectedVideos.has(video.id) ? 'checked' : ''}>
      <img class="channel-avatar" alt="">
      <div class="channel-info">
        <span class="channel-name">${escapeHtml(video.channelName)}${escapeHtml(handleDisplay)}${countDisplay}</span>
        ${tagHtml}
        <span class="video-title">${escapeHtml(video.videoTitle.substring(0, 40))}${video.videoTitle.length > 40 ? '...' : ''}</span>
      </div>
    `;

    // Handle image load errors without inline handler
    const img = div.querySelector('.channel-avatar');
    if (video.thumbnail) img.src = video.thumbnail;
    img.addEventListener('error', () => { img.style.display = 'none'; });
    
    const checkbox = div.querySelector('.channel-checkbox');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedVideos.add(video.id);
      } else {
        selectedVideos.delete(video.id);
      }
      updateVideoCounts();
    });
    
    div.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });
    
    elements.videoList.appendChild(div);
  });
}

function updateVideoCounts() {
  const gamingTagged = foundVideos.filter(v => v.isGaming).length;
  const miscTagged = foundVideos.filter(v => v.isMisc).length;

  elements.videosFoundCount.textContent = `${foundVideos.length} channels`;
  elements.videosSelectedCount.textContent = `${selectedVideos.size} selected`;

  if (gamingTagged + miscTagged > 0) {
    elements.videosGamingCount.textContent = `${gamingTagged} gaming, ${miscTagged} misc`;
    elements.videosGamingCount.classList.remove('hidden');
  } else {
    elements.videosGamingCount.classList.add('hidden');
  }
  
  elements.btnBlockSelected.textContent = `🚫 Don't Recommend Channels (${selectedVideos.size})`;
  elements.btnBlockSelected.disabled = selectedVideos.size === 0;

  // Only channels not already on the lists are worth suggesting
  const suggestableVideos = foundVideos.filter(v => selectedVideos.has(v.id) && !v.isBlocked).length;
  elements.btnSuggestVideos.innerHTML = `<span>💡 Suggest Selected for Shared Lists</span><span>(${suggestableVideos} new)</span>`;
  elements.btnSuggestVideos.disabled = suggestableVideos === 0;
}

function filterVideosBySearch() {
  const query = elements.videoSearchInput.value.toLowerCase().trim();

  document.querySelectorAll('#video-list .channel-item').forEach(item => {
    item.classList.toggle('filtered-out', query && !item.dataset.search.includes(query));
  });
}

// Add every scanned channel whose name, handle, or video title contains
// the keyword to the current selection. Additive, same as subscriptions.
function selectMatchingVideos() {
  const query = elements.videoSearchInput.value.toLowerCase().trim();
  if (!query || foundVideos.length === 0) return;

  const matches = foundVideos.filter(v =>
    `${v.channelName} ${v.channelHandle || ''} ${v.videoTitle || ''}`.toLowerCase().includes(query)
  );
  matches.forEach(v => selectedVideos.add(v.id));

  document.querySelectorAll('#video-list .channel-checkbox').forEach(cb => {
    cb.checked = selectedVideos.has(parseInt(cb.dataset.id));
  });

  updateVideoCounts();
  setStatus(`"${query}": ${matches.length} match(es) added — ${selectedVideos.size} selected total`, matches.length ? 'success' : 'info');
}

function selectGamingVideos() {
  selectedVideos.clear();
  foundVideos.forEach(video => {
    if (video.isBlocked) {
      selectedVideos.add(video.id);
    }
  });
  document.querySelectorAll('#video-list .channel-checkbox').forEach(cb => {
    const id = parseInt(cb.dataset.id);
    cb.checked = selectedVideos.has(id);
  });
  updateVideoCounts();
  const count = foundVideos.filter(v => v.isBlocked).length;
  setStatus(`Selected ${count} channels from block lists`, 'info');
}

function selectAllVideos() {
  foundVideos.forEach(video => {
    selectedVideos.add(video.id);
  });
  document.querySelectorAll('#video-list .channel-checkbox').forEach(cb => {
    cb.checked = true;
  });
  updateVideoCounts();
}

function selectNoneVideos() {
  selectedVideos.clear();
  document.querySelectorAll('#video-list .channel-checkbox').forEach(cb => {
    cb.checked = false;
  });
  updateVideoCounts();
}

async function startBlockingChannels() {
  if (selectedVideos.size === 0) return;

  if (!confirm(`Block ${selectedVideos.size} channel(s) from recommendations?\n\nYou can undo this later via myactivity.google.com`)) {
    return;
  }

  const targets = Array.from(selectedVideos).map(id => {
    const v = foundVideos.find(video => video.id === id);
    return { name: v.channelName, handle: v.channelHandle || '' };
  });

  isRunning = true;
  hideAllSections();
  elements.progressSection.classList.remove('hidden');
  elements.btnStop.disabled = false;
  elements.btnStop.textContent = '⏹️ Stop';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  await chrome.storage.local.set({
    ykm_stop: false,
    ykm_progress: { action: 'block', state: 'running', total: targets.length, done: 0, results: [] }
  });

  // Fire and forget - runs in-page, survives popup close
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: batchBlockDriver,
    args: [targets]
  }).catch(err => setStatus(`Could not start: ${err.message}`, 'error'));

  watchProgress();
}

// Injected into the homepage. Runs the whole "Don't recommend channel"
// batch in-page, reporting progress through chrome.storage.local.
async function batchBlockDriver(targets) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const visible = el => el && el.offsetParent !== null;

  async function pollFor(fn, timeout = 5000, interval = 150) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const result = fn();
      if (result) return result;
      await sleep(interval);
    }
    return null;
  }

  async function report(patch) {
    const { ykm_progress } = await chrome.storage.local.get('ykm_progress');
    await chrome.storage.local.set({ ykm_progress: { ...(ykm_progress || {}), ...patch } });
  }

  async function blockOne(t) {
    // Close any leftover menus from the previous iteration
    document.body.click();
    await sleep(200);

    // Fresh search for a visible video tile from this channel
    const videoElements = document.querySelectorAll('ytd-rich-item-renderer');
    let targetElement = null;

    for (const el of videoElements) {
      if (el.querySelector('[class*="CollectionStack"], .yt-lockup-view-model--collection-stack-2')) continue;
      if (el.style.display === 'none' || el.offsetParent === null) continue;

      const links = el.querySelectorAll('a[href*="/@"]');
      for (const link of links) {
        const href = (link.getAttribute('href') || '').toLowerCase();
        if (href.includes('/watch')) continue;
        const handleMatch = t.handle && href.includes('@' + t.handle.toLowerCase());
        const nameMatch = link.textContent.trim().toLowerCase() === t.name.toLowerCase();
        if (handleMatch || nameMatch) {
          targetElement = el;
          break;
        }
      }
      if (targetElement) break;
    }

    if (!targetElement) return { ok: false, reason: 'no visible video tile for channel' };

    targetElement.scrollIntoView({ behavior: 'instant', block: 'center' });
    await sleep(300);

    const menuBtn = targetElement.querySelector('button[aria-label="More actions"]') ||
                    targetElement.querySelector('[class*="MenuButton"] button') ||
                    targetElement.querySelector('.yt-lockup-metadata-view-model__menu-button button');
    if (!menuBtn) return { ok: false, reason: 'menu button not found' };
    menuBtn.click();

    // Wait for "Don't recommend channel" option in the opened menu
    const item = await pollFor(() => {
      const menuItems = document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-item, [role="menuitem"]');
      for (const mi of menuItems) {
        if (!visible(mi)) continue;
        const text = mi.textContent.toLowerCase();
        if (text.includes("don't recommend channel") || text.includes('dont recommend channel')) {
          return mi;
        }
      }
      // Fallback: search text spans, climb to clickable parent
      const spans = document.querySelectorAll('span, yt-formatted-string');
      for (const span of spans) {
        if (!visible(span)) continue;
        if (span.textContent.toLowerCase().includes("don't recommend channel")) {
          return span.closest('ytd-menu-service-item-renderer, tp-yt-paper-item, [role="menuitem"]') || span.parentElement;
        }
      }
      return null;
    }, 4000);

    if (!item) {
      document.body.click();
      return { ok: false, reason: '"Don\'t recommend channel" option not in menu' };
    }

    item.click();
    await sleep(500);
    return { ok: true, reason: '' };
  }

  const results = [];
  for (let i = 0; i < targets.length; i++) {
    const { ykm_stop } = await chrome.storage.local.get('ykm_stop');
    if (ykm_stop) {
      await report({ state: 'stopped', results });
      return results;
    }

    const t = targets[i];
    await report({ done: i, current: t.name });

    let outcome;
    try {
      outcome = await blockOne(t);
    } catch (e) {
      outcome = { ok: false, reason: e.message };
    }
    results.push({ name: t.name, ok: outcome.ok, reason: outcome.reason });
    await report({ done: i + 1, results });
    await sleep(1000);
  }

  await report({ state: 'finished', done: targets.length, results });
  return results;
}

// ============================================
// HISTORY MODE
// ============================================
async function scanWatchHistory() {
  setStatus('Scanning watch history (auto-scrolling to load more)...', 'info');
  elements.btnScanHistory.disabled = true;
  elements.btnScanHistory.innerHTML = '<span class="loading"></span> Scanning...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('youtube.com/feed/history')) {
      throw new Error('Please go to youtube.com/feed/history first');
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scanHistoryVideos,
      args: [gamingChannelsList, miscChannelsList]
    });

    if (results && results[0] && results[0].result) {
      historyVideos = results[0].result;

      if (historyVideos.length === 0) {
        setStatus('No history videos found. Watch history may be paused or empty.', 'info');
        elements.historyVideosSection.classList.add('hidden');
        elements.historyActionSection.classList.add('hidden');
      } else {
        // Pre-select only videos from channels on the lists
        const blocked = historyVideos.filter(v => v.isBlocked);
        selectedHistory = new Set(blocked.map(v => v.id));
        renderHistoryVideos();
        elements.historyVideosSection.classList.remove('hidden');
        elements.historyActionSection.classList.remove('hidden');
        updateHistoryCounts();
        setStatus(`Found ${historyVideos.length} videos (${blocked.length} from listed channels)`, 'success');
      }
    } else {
      throw new Error('Could not scan history. Make sure you\'re on the watch history page.');
    }
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    elements.btnScanHistory.disabled = false;
    elements.btnScanHistory.innerHTML = '🔍 Scan Watch History';
  }
}

// Injected into /feed/history. Auto-scrolls (capped), then collects each
// history video with its channel so we can match against the block lists.
async function scanHistoryVideos(gamingList, miscList) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Watch history can be years long - cap the scroll hard
  let lastCount = 0;
  let stableRounds = 0;
  for (let i = 0; i < 10 && stableRounds < 2; i++) {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await sleep(900);
    const count = document.querySelectorAll('yt-lockup-view-model').length;
    if (count >= 400) break;
    if (count === lastCount) {
      stableRounds++;
    } else {
      stableRounds = 0;
      lastCount = count;
    }
  }
  window.scrollTo(0, 0);

  const items = document.querySelectorAll('yt-lockup-view-model');
  const videos = [];
  let id = 0;

  items.forEach(el => {
    // Skip playlist/mix collections
    if (el.querySelector('[class*="CollectionStack"]')) return;

    // Title link first (class match); thumbnail link comes earlier in DOM
    // and only carries the duration, so query it strictly before falling back
    const titleEl = el.querySelector('a.ytLockupMetadataViewModelTitle') || el.querySelector('a[href*="/watch"]');
    const videoTitle = titleEl ? titleEl.textContent.trim() : '';
    const titleHref = titleEl ? (titleEl.getAttribute('href') || '') : '';
    const vidMatch = titleHref.match(/[?&]v=([^&]+)/);
    const videoId = vidMatch ? vidMatch[1] : '';

    // Channel is plain text in the metadata row: "Channel • 253K views"
    let channelName = '';
    const metaRow = el.querySelector('.yt-content-metadata-view-model-wiz__metadata-row, yt-content-metadata-view-model');
    if (metaRow) channelName = metaRow.textContent.split('•')[0].trim();

    if (!videoTitle && !channelName) return;

    // History rows expose channel name only (no @handle), so match by name
    const nameLower = channelName.toLowerCase();
    const isGaming = gamingList.some(gc => nameLower === gc);
    const isMisc = miscList.some(mc => nameLower === mc);

    const thumbEl = el.querySelector('img');
    videos.push({
      id: id++,
      videoId,
      videoTitle,
      channelName,
      thumbnail: thumbEl ? thumbEl.src : '',
      isGaming,
      isMisc,
      isBlocked: isGaming || isMisc
    });
  });

  return videos;
}

function renderHistoryVideos() {
  elements.historyList.innerHTML = '';

  historyVideos.forEach(video => {
    const div = document.createElement('div');
    div.className = `channel-item${video.isBlocked ? ' gaming' : ''}`;
    div.dataset.id = video.id;
    div.dataset.search = `${video.channelName} ${video.channelHandle || ''} ${video.videoTitle || ''}`.toLowerCase();

    let tagHtml = '';
    if (video.isGaming) tagHtml += '<span class="channel-tag gaming">Gaming</span>';
    if (video.isMisc) tagHtml += '<span class="channel-tag misc">Misc</span>';

    div.innerHTML = `
      <input type="checkbox" class="channel-checkbox" data-id="${video.id}"
        ${selectedHistory.has(video.id) ? 'checked' : ''}>
      <img class="channel-avatar" alt="">
      <div class="channel-info">
        <span class="channel-name">${escapeHtml(video.channelName || 'Unknown channel')}${tagHtml}</span>
        <span class="video-title">${escapeHtml(video.videoTitle.substring(0, 50))}${video.videoTitle.length > 50 ? '...' : ''}</span>
      </div>
    `;

    const img = div.querySelector('.channel-avatar');
    if (video.thumbnail) img.src = video.thumbnail;
    img.addEventListener('error', () => { img.style.display = 'none'; });

    const checkbox = div.querySelector('.channel-checkbox');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selectedHistory.add(video.id);
      else selectedHistory.delete(video.id);
      updateHistoryCounts();
    });

    div.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });

    elements.historyList.appendChild(div);
  });
}

function updateHistoryCounts() {
  const gamingTagged = historyVideos.filter(v => v.isGaming).length;
  const miscTagged = historyVideos.filter(v => v.isMisc).length;

  elements.historyFoundCount.textContent = `${historyVideos.length} videos`;
  elements.historySelectedCount.textContent = `${selectedHistory.size} selected`;

  if (gamingTagged + miscTagged > 0) {
    elements.historyGamingCount.textContent = `${gamingTagged} gaming, ${miscTagged} misc`;
    elements.historyGamingCount.classList.remove('hidden');
  } else {
    elements.historyGamingCount.classList.add('hidden');
  }

  elements.btnRemoveHistory.textContent = `🗑️ Remove from Watch History (${selectedHistory.size})`;
  elements.btnRemoveHistory.disabled = selectedHistory.size === 0;
}

function filterHistoryBySearch() {
  const query = elements.historySearchInput.value.toLowerCase().trim();
  document.querySelectorAll('#history-list .channel-item').forEach(item => {
    item.classList.toggle('filtered-out', query && !item.dataset.search.includes(query));
  });
}

function selectMatchingHistory() {
  const query = elements.historySearchInput.value.toLowerCase().trim();
  if (!query || historyVideos.length === 0) return;

  const matches = historyVideos.filter(v =>
    `${v.channelName} ${v.channelHandle || ''} ${v.videoTitle || ''}`.toLowerCase().includes(query)
  );
  matches.forEach(v => selectedHistory.add(v.id));

  document.querySelectorAll('#history-list .channel-checkbox').forEach(cb => {
    cb.checked = selectedHistory.has(parseInt(cb.dataset.id));
  });

  updateHistoryCounts();
  setStatus(`"${query}": ${matches.length} match(es) added — ${selectedHistory.size} selected total`, matches.length ? 'success' : 'info');
}

function selectGamingHistory() {
  selectedHistory.clear();
  historyVideos.forEach(v => { if (v.isBlocked) selectedHistory.add(v.id); });
  document.querySelectorAll('#history-list .channel-checkbox').forEach(cb => {
    cb.checked = selectedHistory.has(parseInt(cb.dataset.id));
  });
  updateHistoryCounts();
  const count = historyVideos.filter(v => v.isBlocked).length;
  setStatus(`Selected ${count} videos from listed channels`, 'info');
}

function selectAllHistory() {
  historyVideos.forEach(v => selectedHistory.add(v.id));
  document.querySelectorAll('#history-list .channel-checkbox').forEach(cb => { cb.checked = true; });
  updateHistoryCounts();
}

function selectNoneHistory() {
  selectedHistory.clear();
  document.querySelectorAll('#history-list .channel-checkbox').forEach(cb => { cb.checked = false; });
  updateHistoryCounts();
}

async function startRemoveHistory() {
  if (selectedHistory.size === 0) return;

  if (!confirm(`Remove ${selectedHistory.size} video(s) from watch history?`)) return;

  const targets = Array.from(selectedHistory)
    .map(id => historyVideos.find(v => v.id === id))
    .filter(Boolean)
    .map(v => ({ videoId: v.videoId, title: v.videoTitle, channel: v.channelName }));

  isRunning = true;
  hideAllSections();
  elements.progressSection.classList.remove('hidden');
  elements.btnStop.disabled = false;
  elements.btnStop.textContent = '⏹️ Stop';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  await chrome.storage.local.set({
    ykm_stop: false,
    ykm_progress: { action: 'history', state: 'running', total: targets.length, done: 0, results: [] }
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: batchRemoveHistoryDriver,
    args: [targets]
  }).catch(err => setStatus(`Could not start: ${err.message}`, 'error'));

  watchProgress();
}

// Injected into /feed/history. Removes each selected video from watch
// history, reporting progress through chrome.storage.local.
async function batchRemoveHistoryDriver(targets) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const visible = el => el && el.offsetParent !== null;

  async function pollFor(fn, timeout = 5000, interval = 150) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const result = fn();
      if (result) return result;
      await sleep(interval);
    }
    return null;
  }

  async function report(patch) {
    const { ykm_progress } = await chrome.storage.local.get('ykm_progress');
    await chrome.storage.local.set({ ykm_progress: { ...(ykm_progress || {}), ...patch } });
  }

  // Find the history row for a target by video id (preferred) or exact title
  function findRow(t) {
    const rows = document.querySelectorAll('yt-lockup-view-model');
    for (const el of rows) {
      if (!visible(el)) continue;
      const titleEl = el.querySelector('a.ytLockupMetadataViewModelTitle') || el.querySelector('a[href*="/watch"]');
      if (!titleEl) continue;
      const href = titleEl.getAttribute('href') || '';
      if (t.videoId && href.includes('v=' + t.videoId)) return el;
      if (!t.videoId && titleEl.textContent.trim() === t.title) return el;
    }
    return null;
  }

  async function removeOne(t) {
    // Close any leftover menu from the previous iteration
    document.body.click();
    await sleep(150);

    const row = findRow(t);
    if (!row) return { ok: false, reason: 'video not found (may already be removed)' };
    row.scrollIntoView({ behavior: 'instant', block: 'center' });
    await sleep(150);

    // History rows have no direct remove button - use More actions menu
    const menuBtn = row.querySelector('button[aria-label="More actions"]') ||
                    row.querySelector('button[aria-label="Action menu"]');
    if (!menuBtn) return { ok: false, reason: 'menu button not found' };
    menuBtn.click();

    // New lockup menu items are yt-list-item-view-model (title span
    // .ytListItemViewModelTitle); older menus use ytd-menu-service-item-renderer.
    // Match the title text, then click its clickable container.
    const item = await pollFor(() => {
      const titles = document.querySelectorAll(
        '.ytListItemViewModelTitle, yt-list-item-view-model, ytd-menu-service-item-renderer, tp-yt-paper-item, yt-formatted-string');
      for (const el of titles) {
        if (visible(el) && el.textContent.trim().toLowerCase() === 'remove from watch history') {
          return el.closest('yt-list-item-view-model, ytd-menu-service-item-renderer, tp-yt-paper-item, [role="menuitem"]') || el;
        }
      }
      return null;
    }, 4000);
    if (!item) { document.body.click(); return { ok: false, reason: '"Remove from watch history" not in menu' }; }
    item.click();

    // Verify: the row is gone from the DOM
    const gone = await pollFor(() => (findRow(t) ? null : true), 4000);
    return gone ? { ok: true, reason: '' } : { ok: false, reason: 'clicked but row still present' };
  }

  const results = [];
  for (let i = 0; i < targets.length; i++) {
    const { ykm_stop } = await chrome.storage.local.get('ykm_stop');
    if (ykm_stop) {
      await report({ state: 'stopped', results });
      return results;
    }

    const t = targets[i];
    const label = t.title || t.channel || 'video';
    await report({ done: i, current: label });

    let outcome;
    try {
      outcome = await removeOne(t);
    } catch (e) {
      outcome = { ok: false, reason: e.message };
    }
    results.push({ name: label, ok: outcome.ok, reason: outcome.reason });
    await report({ done: i + 1, results });
    await sleep(700);
  }

  await report({ state: 'finished', done: targets.length, results });
  return results;
}

// ============================================
// CHANNEL SUGGESTIONS (GitHub issue + Action pipeline)
// ============================================
const GITHUB_REPO_URL = 'https://github.com/ObscureAintSecure/youtube-kids-manager';
const MAX_SUGGESTIONS_PER_ISSUE = 30;

// Opens a prefilled GitHub issue suggesting the selected channels for the
// shared lists. The repo's process-suggestion workflow appends them to the
// list files once the maintainer adds the "approved" label.
function openSuggestionIssue(picked) {
  if (picked.length === 0) {
    setStatus('Select at least one channel first, then click Suggest', 'error');
    return;
  }

  const capped = picked.slice(0, MAX_SUGGESTIONS_PER_ISSUE);
  const lines = capped.map(c => `- ${c.name}${c.handle ? ` | ${c.handle}` : ''}`).join('\n');

  const body = [
    'Target list: gaming',
    '',
    '<!-- Change "gaming" to "misc" above if these are not gaming channels. -->',
    '<!-- Remove any lines you did not mean to include. -->',
    '',
    'Channels:',
    lines,
    '',
    `_Submitted from YouTube Manager for Parents._`
  ].join('\n');

  const title = `Channel suggestion: ${capped.length} channel(s)`;
  const url = `${GITHUB_REPO_URL}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  chrome.tabs.create({ url });

  if (picked.length > capped.length) {
    setStatus(`Opened suggestion with first ${MAX_SUGGESTIONS_PER_ISSUE} of ${picked.length} selected channels`, 'info');
  }
}

// ============================================
// SHARED UTILITIES
// ============================================
function hideAllSections() {
  elements.filterSection.classList.add('hidden');
  elements.channelsSection.classList.add('hidden');
  elements.actionSection.classList.add('hidden');
  elements.foundVideosSection.classList.add('hidden');
  elements.blockActionSection.classList.add('hidden');
  elements.historyVideosSection.classList.add('hidden');
  elements.historyActionSection.classList.add('hidden');
  elements.resultsSection.classList.add('hidden');
}

function updateProgress(current, total, message) {
  const percent = (current / total) * 100;
  elements.progressFill.style.width = `${percent}%`;
  elements.progressText.textContent = `${current} / ${total} - ${message}`;
}

function stopProcess() {
  chrome.storage.local.set({ ykm_stop: true });
  elements.btnStop.disabled = true;
  elements.btnStop.textContent = 'Stopping...';
}

// ============================================
// PROGRESS WATCHING (storage-backed, survives popup close/reopen)
// ============================================
function watchProgress() {
  chrome.storage.onChanged.addListener(progressListener);
  refreshProgressFromStorage();
}

function progressListener(changes, area) {
  if (area !== 'local' || !changes.ykm_progress) return;
  renderProgress(changes.ykm_progress.newValue);
}

async function refreshProgressFromStorage() {
  const { ykm_progress } = await chrome.storage.local.get('ykm_progress');
  if (ykm_progress) renderProgress(ykm_progress);
}

function renderProgress(p) {
  if (!p) return;
  if (p.state === 'running') {
    elements.progressSection.classList.remove('hidden');
    elements.resultsSection.classList.add('hidden');
    updateProgress(p.done, p.total, p.current ? `Working on: ${p.current}` : '');
  } else if (p.state === 'finished' || p.state === 'stopped') {
    isRunning = false;
    renderBatchResults(p);
  }
}

function renderBatchResults(p) {
  elements.progressSection.classList.add('hidden');
  elements.resultsSection.classList.remove('hidden');

  const results = p.results || [];
  const ok = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);
  const actionWord = p.action === 'unsubscribe' ? 'unsubscribed'
    : p.action === 'history' ? 'removed from history'
    : 'blocked';

  let html = `<p class="success">✅ Successfully ${actionWord}: ${ok.length}</p>`;
  if (failed.length > 0) {
    html += `<p class="failed">❌ Failed: ${failed.length}</p>`;
    html += failed.map(r =>
      `<p class="failed">• ${escapeHtml(r.name)} — ${escapeHtml(r.reason || 'unknown')}</p>`
    ).join('');
  }
  if (p.state === 'stopped') {
    html += `<p>⏹️ Process was stopped by user</p>`;
  }

  elements.resultsContent.innerHTML = html;
}

function resetUI() {
  chrome.storage.local.remove(['ykm_progress', 'ykm_stop']);
  chrome.storage.onChanged.removeListener(progressListener);
  elements.resultsSection.classList.add('hidden');
  
  if (currentMode === 'subscriptions') {
    elements.filterSection.classList.remove('hidden');
    elements.channelsSection.classList.remove('hidden');
    elements.actionSection.classList.remove('hidden');
  } else if (currentMode === 'history') {
    elements.historyVideosSection.classList.remove('hidden');
    elements.historyActionSection.classList.remove('hidden');
  } else if (currentMode === 'recommendations') {
    elements.foundVideosSection.classList.remove('hidden');
    elements.blockActionSection.classList.remove('hidden');
  }

  setStatus('Ready', 'info');
}

function setStatus(message, type = 'info') {
  elements.statusMessage.textContent = message;
  elements.statusArea.className = 'status-area';
  if (type === 'error') {
    elements.statusArea.classList.add('error');
  } else if (type === 'success') {
    elements.statusArea.classList.add('success');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
