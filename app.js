// Execution State Management Engine
let state = {
    activeTab: "dashboard",
    searchFilter: "",
    rowsPerPage: 10,
    currentPage: 1
};

document.addEventListener("DOMContentLoaded", async () => {
    // Synchronize asynchronously fetched asset streams
    await ScreenerRepository.initAll();
    renderSidebar();
    switchPage("dashboard");
});

function renderSidebar() {
    const menu = document.getElementById("navMenu");
    menu.innerHTML = "";
    
    Object.keys(SCREENERS_CONFIG).forEach(key => {
        const btn = document.createElement("button");
        btn.className = `nav-item ${state.activeTab === key ? 'active' : ''}`;
        btn.innerText = SCREENERS_CONFIG[key].title;
        btn.onclick = () => switchPage(key);
        menu.appendChild(btn);
    });
}

function switchPage(pageKey) {
    state.activeTab = pageKey;
    state.searchFilter = "";
    state.currentPage = 1;
    
    // Reset active structural selections inside navigation elements
    document.querySelectorAll(".nav-item").forEach((btn, index) => {
        btn.classList.toggle("active", Object.keys(SCREENERS_CONFIG)[index] === pageKey);
    });

    const cfg = SCREENERS_CONFIG[pageKey];
    document.getElementById("currentPageTitle").innerText = cfg.title;
    
    renderMainView();
}

function renderMainView() {
    const panel = document.getElementById("viewPanel");
    panel.innerHTML = "";

    if (state.activeTab === "dashboard") {
        renderDashboard(panel);
    } else {
        renderScreenerTable(panel, state.activeTab);
    }
}

function renderDashboard(target) {
    // Summary KPI Block
    let cardsHtml = `<div class="metrics-grid">`;
    Object.keys(SCREENERS_CONFIG).forEach(key => {
        if (key === "dashboard") return;
        const count = ScreenerRepository.data[key]?.length || 0;
        cardsHtml += `
            <div class="metric-card">
                <h3>${SCREENERS_CONFIG[key].title}</h3>
                <div class="value">${count}</div>
                <div class="origin">${SCREENERS_CONFIG[key].type?.toUpperCase() || 'CHARTINK'}</div>
            </div>`;
    });
    cardsHtml += `</div>`;

    // Confluence Analysis Implementation
    const matchesMap = {};
    Object.keys(ScreenerRepository.data).forEach(screenerKey => {
        ScreenerRepository.data[screenerKey].forEach(stock => {
            if (!matchesMap[stock.Ticker]) {
                matchesMap[stock.Ticker] = { name: stock.Name, counts: 0, trackingSources: [] };
            }
            matchesMap[stock.Ticker].counts += 1;
            matchesMap[stock.Ticker].trackingSources.push(SCREENERS_CONFIG[screenerKey].title);
        });
    });

    let confluenceRows = "";
    Object.keys(matchesMap).forEach(ticker => {
        const obj = matchesMap[ticker];
        if (obj.counts > 1) {
            confluenceRows += `
                <tr>
                    <td><strong>${ticker}</strong></td>
                    <td>${obj.name}</td>
                    <td><span style="color: var(--accent-green); font-weight:bold;">${obj.counts} Scans</span></td>
                    <td>${obj.trackingSources.join(" | ")}</td>
                </tr>`;
        }
    });

    const tableHtml = `
        <div class="table-wrapper">
            <h3 style="margin-bottom: 15px;">🔥 Institutional Confluence Matrix (Multi-Scan Overlaps)</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Company Name</th>
                        <th>Signal Matches</th>
                        <th>Active Indicators</th>
                    </tr>
                </thead>
                <tbody>
                    ${confluenceRows || `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No multi-scan overlapping assets tracked currently.</td></tr>`}
                </tbody>
            </table>
        </div>`;

    target.innerHTML = cardsHtml + tableHtml;
}

function renderScreenerTable(target, screenerKey) {
    let dataset = ScreenerRepository.data[screenerKey] || [];
    
    // Apply local search filtering mechanism inline
    if (state.searchFilter) {
        dataset = dataset.filter(item => 
            item.Ticker.includes(state.searchFilter.toUpperCase()) || 
            item.Name.toUpperCase().includes(state.searchFilter.toUpperCase())
        );
    }

    // Calculations for Client-side Pagination
    const totalRows = dataset.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / state.rowsPerPage));
    const startIdx = (state.currentPage - 1) * state.rowsPerPage;
    const endIdx = Math.min(startIdx + state.rowsPerPage, totalRows);
    const paginatedSlice = dataset.slice(startIdx, endIdx);

    let rowsHtml = "";
    paginatedSlice.forEach(row => {
        const colorStyle = row.Change >= 0 ? "color: var(--accent-green);" : "color: #ef4444;";
        rowsHtml += `
            <tr>
                <td><strong>${row.Ticker}</strong></td>
                <td>${row.Name}</td>
                <td>₹${row.Close.toFixed(2)}</td>
                <td style="${colorStyle}">${row.Change >= 0 ? '+' : ''}${row.Change}%</td>
            </tr>`;
    });

    target.innerHTML = `
        <div class="table-wrapper">
            <div class="table-controls">
                <input type="text" class="search-input" id="tableSearch" placeholder="⚡ Filter results..." value="${state.searchFilter}">
                <div>
                    <label style="font-size:0.85rem; color: var(--text-muted); margin-right: 8px;">Rows per page:</label>
                    <select id="rowsSelect" class="search-input" style="width:90px; padding:6px 10px;">
                        <option value="5" ${state.rowsPerPage === 5 ? 'selected' : ''}>5</option>
                        <option value="10" ${state.rowsPerPage === 10 ? 'selected' : ''}>10</option>
                        <option value="20" ${state.rowsPerPage === 20 ? 'selected' : ''}>20</option>
                    </select>
                </div>
            </div>
            <table class="data-table">
                <thead>
                    <tr><th>Ticker</th><th>Stock Name</th><th>Close Price</th><th>Day Change</th></tr>
                </thead>
                <tbody>
                    ${rowsHtml || `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No records match criteria.</td></tr>`}
                </tbody>
            </table>
            <div class="pagination-container">
                <span style="font-size: 0.9rem; color: var(--text-muted);">Showing rows ${totalRows === 0 ? 0 : startIdx + 1} to ${endIdx} of ${totalRows} entries</span>
                <div>
                    <button class="pagination-btn" id="prevBtn" ${state.currentPage === 1 ? 'disabled' : ''}>Previous</button>
                    <span style="margin: 0 15px; font-weight:600;">Page ${state.currentPage} of ${totalPages}</span>
                    <button class="pagination-btn" id="nextBtn" ${state.currentPage === totalPages ? 'disabled' : ''}>Next</button>
                </div>
            </div>
        </div>`;

    // Reattach operational framework events to elements inside current screen view
    document.getElementById("tableSearch").addEventListener("input", (e) => {
        state.searchFilter = e.target.value;
        state.currentPage = 1;
        renderScreenerTable(target, screenerKey);
    });

    document.getElementById("rowsSelect").addEventListener("change", (e) => {
        state.rowsPerPage = parseInt(e.target.value);
        state.currentPage = 1;
        renderScreenerTable(target, screenerKey);
    });

    document.getElementById("prevBtn").onclick = () => {
        if (state.currentPage > 1) { state.currentPage--; renderScreenerTable(target, screenerKey); }
    };
    
    document.getElementById("nextBtn").onclick = () => {
        if (state.currentPage < totalPages) { state.currentPage++; renderScreenerTable(target, screenerKey); }
    };
}

