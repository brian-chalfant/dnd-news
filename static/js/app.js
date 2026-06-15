// Global Application State
let state = {
    updates: [],
    filteredUpdates: [],
    selectedUpdate: null,
    filters: {
        search: '',
        category: 'all',
        sort: 'latest'
    },
    tweetOptions: {
        includeLink: true,
        includeHashtags: true,
        includeEmojis: true,
        style: 'pro' // 'pro' (Hype Bard), 'casual' (Casual Player), 'minimal' (Short Scroll)
    }
};

// DOM Elements
const elements = {
    btnRefresh: document.getElementById('btn-refresh'),
    lastUpdatedBadge: document.getElementById('last-updated-badge'),
    searchInput: document.getElementById('search-input'),
    clearSearch: document.getElementById('clear-search'),
    categoryFilters: document.getElementById('category-filters'),
    sortSelect: document.getElementById('sort-select'),
    updatesList: document.getElementById('updates-list'),
    emptyState: document.getElementById('empty-state'),
    btnResetFilters: document.getElementById('btn-reset-filters'),
    feedStats: document.getElementById('feed-stats'),
    visibleCount: document.getElementById('visible-count'),
    totalCount: document.getElementById('total-count'),
    
    // Drawer Elements
    tweetDrawer: document.getElementById('tweet-drawer'),
    drawerBackdrop: document.getElementById('drawer-backdrop'),
    btnCloseDrawer: document.getElementById('btn-close-drawer'),
    previewTypeBadge: document.getElementById('preview-type-badge'),
    previewDate: document.getElementById('preview-date'),
    previewBodyHtml: document.getElementById('preview-body-html'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    tweetCharCount: document.getElementById('tweet-char-count'),
    charWarning: document.getElementById('char-warning'),
    btnCopyTweet: document.getElementById('btn-copy-tweet'),
    btnSendTweet: document.getElementById('btn-send-tweet'),
    
    // Toggles
    toggleLink: document.getElementById('toggle-link'),
    toggleHashtags: document.getElementById('toggle-hashtags'),
    toggleEmoji: document.getElementById('toggle-emoji'),
    stylePills: document.querySelectorAll('.quick-templates .btn-pill'),
    
    // Toast
    toastContainer: document.getElementById('toast-container')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchUpdates(false);
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Refresh action
    elements.btnRefresh.addEventListener('click', () => fetchUpdates(true));
    
    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        state.filters.search = e.target.value.trim().toLowerCase();
        toggleClearSearchButton();
        filterAndRender();
    });
    
    // Clear search button
    elements.clearSearch.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.filters.search = '';
        toggleClearSearchButton();
        filterAndRender();
        elements.searchInput.focus();
    });
    
    // Category filters
    elements.categoryFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        
        elements.categoryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        state.filters.category = btn.dataset.category;
        filterAndRender();
    });
    
    // Sort select
    elements.sortSelect.addEventListener('change', (e) => {
        state.filters.sort = e.target.value;
        filterAndRender();
    });
    
    // Reset filters button
    elements.btnResetFilters.addEventListener('click', resetFilters);
    
    // Drawer close
    elements.btnCloseDrawer.addEventListener('click', closeDrawer);
    elements.drawerBackdrop.addEventListener('click', closeDrawer);
    
    // Composer Options Toggles
    elements.toggleLink.addEventListener('change', (e) => {
        state.tweetOptions.includeLink = e.target.checked;
        generateTweet();
    });
    
    elements.toggleHashtags.addEventListener('change', (e) => {
        state.tweetOptions.includeHashtags = e.target.checked;
        generateTweet();
    });
    
    elements.toggleEmoji.addEventListener('change', (e) => {
        state.tweetOptions.includeEmojis = e.target.checked;
        generateTweet();
    });
    
    // Style Pills
    elements.stylePills.forEach(pill => {
        pill.addEventListener('click', () => {
            elements.stylePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.tweetOptions.style = pill.dataset.style;
            generateTweet();
        });
    });
    
    // Custom Tweet input handler
    elements.tweetTextarea.addEventListener('input', () => {
        updateCharacterCount();
    });
    
    // Actions
    elements.btnCopyTweet.addEventListener('click', copyTweetToClipboard);
    elements.btnSendTweet.addEventListener('click', sendTweet);
}

// Show clear search button when search is not empty
function toggleClearSearchButton() {
    if (elements.searchInput.value.length > 0) {
        elements.clearSearch.style.display = 'block';
    } else {
        elements.clearSearch.style.display = 'none';
    }
}

// Reset filters to default
function resetFilters() {
    elements.searchInput.value = '';
    state.filters.search = '';
    toggleClearSearchButton();
    
    elements.categoryFilters.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.category === 'all') btn.classList.add('active');
        else btn.classList.remove('active');
    });
    state.filters.category = 'all';
    
    elements.sortSelect.value = 'latest';
    state.filters.sort = 'latest';
    
    filterAndRender();
}

// Fetch updates from Flask backend
async function fetchUpdates(forceRefresh = false) {
    toggleLoadingState(true);
    
    try {
        const url = `/api/updates${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error, 'error');
            setLastUpdatedText('Error syncing');
            renderUpdates([]);
            return;
        }
        
        state.updates = data.updates || [];
        filterAndRender();
        
        // Update last updated status
        if (data.last_fetched) {
            const date = new Date(data.last_fetched * 1000);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLastUpdatedText(`Synced at ${timeStr}`);
            if (forceRefresh) {
                showToast('Roadmap updated successfully', 'success');
            }
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('Failed to connect to the server', 'error');
        setLastUpdatedText('Connection error');
        renderUpdates([]);
    } finally {
        toggleLoadingState(false);
    }
}

// Set state text in badge
function setLastUpdatedText(text) {
    const textElem = elements.lastUpdatedBadge.querySelector('.status-text');
    const dot = elements.lastUpdatedBadge.querySelector('.status-dot');
    textElem.textContent = text;
    
    dot.className = 'status-dot';
    if (text.includes('Synced')) {
        dot.classList.add('green');
    } else if (text.includes('Loading') || text.includes('Syncing')) {
        dot.classList.add('loading');
    } else {
        dot.style.backgroundColor = '#ef4444';
        dot.style.boxShadow = '0 0 8px #ef4444';
    }
}

// Toggle refresh button spinner & loading styles
function toggleLoadingState(isLoading) {
    const icon = elements.btnRefresh.querySelector('.refresh-icon');
    const text = elements.btnRefresh.querySelector('span');
    
    if (isLoading) {
        elements.btnRefresh.disabled = true;
        icon.classList.add('spinning');
        text.textContent = 'Syncing...';
        setLastUpdatedText('Syncing roadmap...');
        
        if (state.updates.length === 0) {
            elements.updatesList.innerHTML = `
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
            `;
            elements.emptyState.style.display = 'none';
        }
    } else {
        elements.btnRefresh.disabled = false;
        icon.classList.remove('spinning');
        text.textContent = 'Sync';
    }
}

// Filter and render core logic
function filterAndRender() {
    let results = [...state.updates];
    
    // 1. Text Search Filter
    if (state.filters.search) {
        const query = state.filters.search;
        results = results.filter(item => 
            item.title.toLowerCase().includes(query) ||
            item.type.toLowerCase().includes(query) ||
            item.season.toLowerCase().includes(query) ||
            item.content_text.toLowerCase().includes(query) ||
            item.date.toLowerCase().includes(query)
        );
    }
    
    // 2. Category Filter
    if (state.filters.category !== 'all') {
        results = results.filter(item => item.type === state.filters.category);
    }
    
    // 3. Sorting (by release date)
    if (state.filters.sort === 'latest') {
        results.sort((a, b) => new Date(b.updated) - new Date(a.updated));
    } else {
        results.sort((a, b) => new Date(a.updated) - new Date(b.updated));
    }
    
    state.filteredUpdates = results;
    
    elements.visibleCount.textContent = results.length;
    elements.totalCount.textContent = state.updates.length;
    elements.feedStats.style.display = state.updates.length > 0 ? 'block' : 'none';
    
    renderUpdates(results);
}

// Render update card list inside grid
function renderUpdates(updates) {
    elements.updatesList.innerHTML = '';
    
    if (updates.length === 0) {
        elements.emptyState.style.display = 'block';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    
    updates.forEach(update => {
        const card = document.createElement('article');
        card.className = 'update-card';
        card.dataset.id = update.id;
        card.dataset.type = update.type;
        card.dataset.status = update.status;
        
        if (state.selectedUpdate && state.selectedUpdate.id === update.id) {
            card.classList.add('selected');
        }
        
        // Dynamic icon for seasons/status
        let seasonIcon = 'fa-compass';
        if (update.season.includes('Horror')) seasonIcon = 'fa-ghost';
        else if (update.season.includes('Magic')) seasonIcon = 'fa-wand-magic-sparkles';
        else if (update.season.includes('Champions')) seasonIcon = 'fa-trophy';
        else if (update.season.includes('News')) seasonIcon = 'fa-newspaper';
        
        let statusIcon = 'fa-calendar';
        if (update.status === 'Released') statusIcon = 'fa-circle-check';
        else if (update.status === 'Upcoming') statusIcon = 'fa-hourglass-half';
        else if (update.status === 'Releasing Today') statusIcon = 'fa-bolt';
        else if (update.status === 'News') statusIcon = 'fa-rss';
        
        // Badge type styling
        const typeClass = update.type.toLowerCase().replace(' ', '-');
        const badgeClass = `badge badge-${typeClass}`;
        
        card.innerHTML = `
            <div>
                <div class="card-header">
                    <span class="${badgeClass}">${update.type}</span>
                    <time class="card-date">${update.date}</time>
                </div>
                <h2 class="card-title">${update.title}</h2>
                <div class="card-season">
                    <i class="fa-solid ${seasonIcon}"></i>
                    <span>${update.season}</span>
                </div>
                <div class="card-status-bar">
                    <i class="fa-solid ${statusIcon}"></i>
                    <span>${update.status_label}</span>
                </div>
                <div class="card-content">
                    ${update.content_html}
                </div>
            </div>
            <div class="card-actions">
                ${update.link ? `
                    <a href="${update.link}" target="_blank" class="card-link" rel="noopener noreferrer">
                        Details <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                ` : '<span></span>'}
                <button class="btn-select-tweet">
                    <i class="fa-brands fa-x-twitter"></i>
                    <span>Share Release</span>
                </button>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-link')) return;
            selectUpdate(update);
        });
        
        elements.updatesList.appendChild(card);
    });
}

// Select an update to compose tweet
function selectUpdate(update) {
    state.selectedUpdate = update;
    
    // Highlight correct card in grid
    document.querySelectorAll('.update-card').forEach(card => {
        if (card.dataset.id === update.id) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    // Fill drawer details
    elements.previewTypeBadge.textContent = update.type;
    const typeClass = update.type.toLowerCase().replace(' ', '-');
    elements.previewTypeBadge.className = `preview-badge badge-${typeClass}`;
    elements.previewDate.textContent = update.date;
    
    elements.previewBodyHtml.innerHTML = `
        <h3 style="font-family: var(--font-heading); color: white; margin-bottom: 0.5rem; font-size: 1.1rem;">${update.title}</h3>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem; font-weight: 500;">
            ${update.season} &bull; ${update.status_label}
        </div>
        ${update.content_html}
    `;
    
    // Open drawer
    elements.tweetDrawer.classList.add('open');
    elements.drawerBackdrop.classList.add('active');
    
    document.body.style.overflow = 'hidden';
    
    elements.toggleLink.checked = state.tweetOptions.includeLink;
    elements.toggleHashtags.checked = state.tweetOptions.includeHashtags;
    elements.toggleEmoji.checked = state.tweetOptions.includeEmojis;
    
    elements.stylePills.forEach(pill => {
        if (pill.dataset.style === state.tweetOptions.style) pill.classList.add('active');
        else pill.classList.remove('active');
    });
    
    generateTweet();
    elements.tweetTextarea.focus();
}

// Close Tweet Composer Drawer
function closeDrawer() {
    elements.tweetDrawer.classList.remove('open');
    elements.drawerBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    
    state.selectedUpdate = null;
    document.querySelectorAll('.update-card').forEach(card => {
        card.classList.remove('selected');
    });
}

// Tweet generator tailored for D&D Books & news
function generateTweet() {
    if (!state.selectedUpdate) return;
    
    const update = state.selectedUpdate;
    const style = state.tweetOptions.style;
    const includeLink = state.tweetOptions.includeLink;
    const includeHashtags = state.tweetOptions.includeHashtags;
    const includeEmojis = state.tweetOptions.includeEmojis;
    
    // 1. RPG-themed Emojis selection
    let emoji = '';
    if (includeEmojis) {
        if (style === 'pro') {
            switch(update.type) {
                case 'Core Rulebook': emoji = '🎲 '; break;
                case 'Sourcebook': emoji = '📜 '; break;
                case 'Adventure': emoji = '⚔️ '; break;
                case 'Accessory': emoji = '🛠️ '; break;
                default: emoji = '📢 '; // News
            }
        } else if (style === 'casual') {
            switch(update.type) {
                case 'Core Rulebook': emoji = '🔥 '; break;
                case 'Sourcebook': emoji = '👀 '; break;
                case 'Adventure': emoji = '🐉 '; break;
                case 'Accessory': emoji = '✨ '; break;
                default: emoji = '📰 ';
            }
        } else {
            emoji = '🐉 ';
        }
    }
    
    // 2. Draft layouts by style
    let prefix = '';
    let suffix = '';
    let hashtags = '';
    
    if (style === 'pro') {
        // Hype Bard style
        if (update.type === 'News Update') {
            prefix = `${emoji}D&D News Alert: `;
        } else {
            prefix = `${emoji}New WotC D&D Release: "${update.title}" (${update.status_label})! `;
        }
        if (includeHashtags) {
            hashtags = '\n\n#DnD #DungeonsAndDragons #ttrpg';
        }
    } else if (style === 'casual') {
        // Casual Player style
        if (update.type === 'News Update') {
            prefix = `${emoji}Just saw this D&D news! "${update.title}" - `;
        } else {
            prefix = `${emoji}So hyped for this new D&D book: "${update.title}" (${update.date})! `;
        }
        if (includeHashtags) {
            hashtags = '\n\n#dnd5e #ttrpgs';
        }
    } else {
        // Short Scroll style
        prefix = `${emoji}"${update.title}": `;
    }
    
    // 3. Compute available character count
    // URLs are counted as exactly 23 characters
    const urlLength = includeLink && update.link ? 23 : 0;
    const linebreaks = (includeLink && update.link ? 2 : 0) + (includeHashtags && hashtags ? 2 : 0);
    const formattingLength = prefix.length + urlLength + hashtags.length + linebreaks;
    const maxContentLength = 280 - formattingLength;
    
    // 4. Truncate text content smart
    let content = update.content_text;
    if (content.length > maxContentLength) {
        content = content.substring(0, maxContentLength - 3).trim() + '...';
    }
    
    // 5. Build full Tweet
    let tweetText = `${prefix}${content}`;
    if (includeLink && update.link) {
        tweetText += `\n\nRead more: ${update.link}`;
    }
    if (includeHashtags && hashtags) {
        tweetText += hashtags;
    }
    
    elements.tweetTextarea.value = tweetText;
    updateCharacterCount();
}

// Update the visual character counter for Twitter (handling URL 23 character substitution)
function updateCharacterCount() {
    if (!state.selectedUpdate) return;
    
    const text = elements.tweetTextarea.value;
    const url = state.selectedUpdate.link;
    
    let twitterLength = text.length;
    
    if (url && text.includes(url)) {
        const escapedUrl = url.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const replaced = text.replace(new RegExp(escapedUrl, 'g'), "12345678901234567890123");
        twitterLength = replaced.length;
    }
    
    elements.tweetCharCount.textContent = `${twitterLength} / 280`;
    
    if (twitterLength > 280) {
        elements.tweetCharCount.className = 'char-count danger';
        elements.charWarning.style.display = 'flex';
        elements.btnSendTweet.disabled = true;
    } else if (twitterLength > 250) {
        elements.tweetCharCount.className = 'char-count warning';
        elements.charWarning.style.display = 'none';
        elements.btnSendTweet.disabled = false;
    } else {
        elements.tweetCharCount.className = 'char-count';
        elements.charWarning.style.display = 'none';
        elements.btnSendTweet.disabled = false;
    }
}

// Action: Copy tweet to clipboard
function copyTweetToClipboard() {
    const text = elements.tweetTextarea.value;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Draft copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Could not copy text: ', err);
        showToast('Failed to copy draft', 'error');
    });
}

// Action: Open Twitter / X Share Intent in new window
function sendTweet() {
    const text = elements.tweetTextarea.value;
    const encodedText = encodeURIComponent(text);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    showToast('Redirected to X / Twitter!', 'success');
}

// Show animated toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' 
        ? '<i class="fa-solid fa-circle-check"></i>' 
        : '<i class="fa-solid fa-circle-exclamation"></i>';
        
    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
