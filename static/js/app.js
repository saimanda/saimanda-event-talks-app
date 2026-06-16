document.addEventListener('DOMContentLoaded', () => {
    // State
    let feedData = { entries: [] };
    let selectedUpdate = null;
    let currentFilter = 'all';
    let searchQuery = '';
    
    // DOM Elements
    const searchInput = document.getElementById('search-input');
    const filterPills = document.querySelectorAll('.filter-pill');
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = refreshBtn.querySelector('svg');
    const releaseFeedEl = document.getElementById('release-feed');
    
    // Composer DOM Elements
    const composerPlaceholder = document.getElementById('composer-placeholder');
    const composerForm = document.getElementById('composer-form');
    const composerTextarea = document.getElementById('composer-textarea');
    const previewBadge = document.getElementById('preview-source-badge');
    const charProgressCircle = document.getElementById('char-progress');
    const charCountEl = document.getElementById('char-count');
    const btnTweet = document.getElementById('btn-tweet');
    const btnCopy = document.getElementById('btn-copy');
    const composerSidebar = document.getElementById('composer-sidebar');
    const composerBackdrop = document.getElementById('composer-backdrop');
    
    // Toast Element
    const toast = document.getElementById('toast');
    
    // Fetch release notes
    async function fetchReleases(isRefresh = false) {
        setLoadingState(true);
        if (isRefresh) {
            refreshIcon.classList.add('spin');
            refreshBtn.disabled = true;
        }
        
        try {
            const response = await fetch('/api/releases');
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Server error fetching feed.');
            }
            
            feedData = await response.json();
            renderFeed();
            
            // Auto-select first update if available
            if (feedData.entries.length > 0 && feedData.entries[0].updates.length > 0) {
                const firstEntry = feedData.entries[0];
                const firstUpdate = firstEntry.updates[0];
                selectUpdate(firstUpdate, firstEntry.date, firstEntry.link);
            }
        } catch (error) {
            console.error('Error fetching releases:', error);
            renderErrorState(error.message);
        } finally {
            setLoadingState(false);
            if (isRefresh) {
                refreshIcon.classList.remove('spin');
                refreshBtn.disabled = false;
                showToast('Feed refreshed successfully!');
            }
        }
    }
    
    // Loading State UI Helper
    function setLoadingState(isLoading) {
        if (isLoading) {
            releaseFeedEl.innerHTML = `
                <div class="feed-state">
                    <svg class="spin" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="2" x2="12" y2="6"></line>
                        <line x1="12" y1="18" x2="12" y2="22"></line>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                        <line x1="2" y1="12" x2="6" y2="12"></line>
                        <line x1="18" y1="12" x2="22" y2="12"></line>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                    </svg>
                    <h3>Fetching latest releases...</h3>
                    <p>Connecting to Google Cloud RSS feeds to get the newest BigQuery updates.</p>
                </div>
            `;
        }
    }
    
    // Error State UI Helper
    function renderErrorState(message) {
        releaseFeedEl.innerHTML = `
            <div class="feed-state" style="border-color: rgba(239, 68, 68, 0.3);">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <h3 style="color: #EF4444;">Unable to load feed</h3>
                <p style="margin-bottom: 1rem;">${message}</p>
                <button id="retry-btn" class="btn btn-primary">Retry Fetch</button>
            </div>
        `;
        
        document.getElementById('retry-btn')?.addEventListener('click', () => fetchReleases(true));
    }
    
    // Check if an update matches filters
    function matchesFilter(update, date) {
        // Category Filter
        const typeLower = update.type.toLowerCase();
        if (currentFilter !== 'all') {
            if (currentFilter === 'feature' && typeLower !== 'feature') return false;
            if (currentFilter === 'issue' && typeLower !== 'issue') return false;
            if (currentFilter === 'changed' && (typeLower !== 'changed' && typeLower !== 'modified')) return false;
            if (currentFilter === 'deprecated' && (typeLower !== 'deprecated' && typeLower !== 'removed')) return false;
        }
        
        // Search text Filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const inContent = update.content_text.toLowerCase().includes(query);
            const inType = update.type.toLowerCase().includes(query);
            const inDate = date.toLowerCase().includes(query);
            return inContent || inType || inDate;
        }
        
        return true;
    }
    
    // Render Feed
    function renderFeed() {
        releaseFeedEl.innerHTML = '';
        let hasMatches = false;
        
        feedData.entries.forEach(entry => {
            // Filter updates within this entry
            const matchingUpdates = entry.updates.filter(upd => matchesFilter(upd, entry.date));
            
            if (matchingUpdates.length > 0) {
                hasMatches = true;
                
                const groupEl = document.createElement('div');
                groupEl.className = 'date-group';
                
                groupEl.innerHTML = `
                    <div class="date-header">
                        <span class="date-title">${entry.date}</span>
                        <div class="date-line"></div>
                    </div>
                `;
                
                matchingUpdates.forEach(update => {
                    const cardEl = document.createElement('div');
                    const typeClass = update.type.toLowerCase().replace(/\s+/g, '-');
                    cardEl.className = `update-card type-${typeClass}`;
                    if (selectedUpdate && selectedUpdate.content_html === update.content_html) {
                        cardEl.classList.add('selected');
                    }
                    
                    cardEl.innerHTML = `
                        <div class="card-header">
                            <div class="badge-wrapper">
                                <span class="badge badge-${typeClass}">${update.type}</span>
                            </div>
                            <div class="card-selection-indicator">
                                <svg viewBox="0 0 24 24">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                        </div>
                        <div class="card-body">
                            ${update.content_html}
                        </div>
                    `;
                    
                    cardEl.addEventListener('click', () => {
                        selectUpdate(update, entry.date, entry.link);
                        
                        // Update visual selection on feed
                        document.querySelectorAll('.update-card').forEach(c => c.classList.remove('selected'));
                        cardEl.classList.add('selected');
                    });
                    
                    groupEl.appendChild(cardEl);
                });
                
                releaseFeedEl.appendChild(groupEl);
            }
        });
        
        if (!hasMatches) {
            releaseFeedEl.innerHTML = `
                <div class="feed-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <h3>No results found</h3>
                    <p>Try clearing your search filters or searching for something else.</p>
                </div>
            `;
        }
    }
    
    // Select an update to compose tweet
    function selectUpdate(update, date, link) {
        selectedUpdate = update;
        
        // Show form, hide placeholder
        composerPlaceholder.style.display = 'none';
        composerForm.style.display = 'flex';
        
        // Show badges
        previewBadge.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.25rem;">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${date} • ${update.type}
        `;
        
        // Prepare pre-filled Tweet Text
        // Ideal format: "BigQuery Release Note ({date} - {type}): {content_text} {link} #GoogleCloud #BigQuery"
        // Let's compute text truncation
        const titlePart = `BigQuery Release Note (${date} - ${update.type}): `;
        const hashtagsPart = ` #GoogleCloud #BigQuery`;
        
        // A Twitter link counts as 23 characters
        const urlLength = 23;
        
        // Calculate remaining text space
        // 280 - titleLength - urlLength - hashtagsLength - padding
        const maxTextSpace = 280 - titlePart.length - urlLength - hashtagsPart.length - 4;
        
        let updateText = update.content_text;
        if (updateText.length > maxTextSpace) {
            updateText = updateText.substring(0, maxTextSpace - 3) + '...';
        }
        
        const fullTweetText = `${titlePart}"${updateText}" ${link}${hashtagsPart}`;
        composerTextarea.value = fullTweetText;
        
        updateCharCounter();
        
        // Trigger drawer opening on mobile
        if (window.innerWidth <= 1024) {
            composerSidebar.classList.add('drawer-open');
            composerBackdrop.classList.add('active');
        }
    }
    
    // Twitter/X Character Counting Logic
    // Matches t.co short links behaving as 23 characters
    function countTwitterChars(text) {
        const urlRegex = /https?:\/\/[^\s]+/g;
        const textWithUrlPlaceholders = text.replace(urlRegex, '12345678901234567890123');
        return textWithUrlPlaceholders.length;
    }
    
    function updateCharCounter() {
        const count = countTwitterChars(composerTextarea.value);
        const maxChars = 280;
        const remaining = maxChars - count;
        
        charCountEl.textContent = remaining;
        
        // Color coding depending on limits
        charCountEl.className = 'char-count';
        if (remaining < 0) {
            charCountEl.classList.add('danger');
            btnTweet.disabled = true;
        } else if (remaining <= 20) {
            charCountEl.classList.add('warning');
            btnTweet.disabled = false;
        } else {
            btnTweet.disabled = false;
        }
        
        // Progress Circle Animation
        const radius = 18;
        const circumference = 2 * Math.PI * radius;
        const progress = Math.max(0, Math.min(1, count / maxChars));
        const offset = circumference - (progress * circumference);
        
        charProgressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
        charProgressCircle.style.strokeDashoffset = offset;
        
        // Color of progress ring
        if (remaining < 0) {
            charProgressCircle.style.stroke = 'var(--color-issue)';
        } else if (remaining <= 20) {
            charProgressCircle.style.stroke = 'var(--color-deprecated)';
        } else {
            charProgressCircle.style.stroke = 'var(--twitter-blue)';
        }
    }
    
    // Copy Tweet to Clipboard
    btnCopy.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(composerTextarea.value);
            showToast('Tweet copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers
            composerTextarea.select();
            document.execCommand('copy');
            showToast('Tweet copied to clipboard!');
        }
    });
    
    // Open Twitter Web Intent
    btnTweet.addEventListener('click', () => {
        const tweetText = composerTextarea.value;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(url, '_blank', 'width=600,height=400,resizable=yes');
    });
    
    // Close Drawer Helper (Mobile)
    function closeDrawer() {
        composerSidebar.classList.remove('drawer-open');
        composerBackdrop.classList.remove('active');
    }
    
    composerBackdrop.addEventListener('click', closeDrawer);
    
    // Textarea input monitoring
    composerTextarea.addEventListener('input', updateCharCounter);
    
    // Search filter input listener
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderFeed();
    });
    
    // Filter pill click listeners
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            
            currentFilter = pill.getAttribute('data-filter');
            renderFeed();
        });
    });
    
    // Refresh button click listener
    refreshBtn.addEventListener('click', () => fetchReleases(true));
    
    // Toast Notification System
    let toastTimeout;
    function showToast(message) {
        clearTimeout(toastTimeout);
        toast.querySelector('.toast-text').textContent = message;
        toast.classList.add('show');
        
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Initial Fetch
    fetchReleases();
});
