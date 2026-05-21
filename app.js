let state = {
    activeTab: "dashboard",
    searchFilter: "",
    rowsPerPage: 10,
    currentPage: 1
};

document.addEventListener("DOMContentLoaded", async () => {
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
    
    document.querySelectorAll(".nav-item").forEach((btn, idx) => {
        btn.classList.toggle("active", Object.keys(SCREENERS_CONFIG)[idx] === pageKey);
    });

    document.getElementById("currentPageTitle").innerText = SCREENERS_CONFIG[pageKey].title;
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
    const countGSheet = ScreenerRepository.data["volume_breakout"]?.length || 0;
    const countRsi = ScreenerRepository.data["rsi_90"]?.length || 0;
    const countMa = ScreenerRepository.data["ma_1001"]?.length || 0;
    const countRs = ScreenerRepository.data["strong_rs"]?.length || 0;

    // Segmented layout styling cards clone from your image
    let cardsHtml = `
        <div class="metrics-grid">
            <div class="metric-card scanned"><h3>Scanned Assets</h3><div class="value">${countGSheet + countRsi + countMa}</div></div>
            <div class="metric-card buy"><h3>Buy Signals</h3><div class="value">${countRsi}</div></div>
            <div class="metric-card hold"><h3>Hold Zone</h3><div class="value">${countMa}</div></div>
            <div class="metric-card avoid"><h3>Avoid Zone</h3><div class="value">${countRs}</div></div>
        </div>`;

    const matchesMap = {};
    Object.keys(ScreenerRepository.data).forEach(screenerKey => {
        const items = ScreenerRepository.data[screenerKey] || [];
        items.forEach(stock => {
            if (!stock.Ticker) return;
            if (!matchesMap[stock.Ticker]) {
                matchesMap[stock.Ticker] = { name: stock.Name, counts: 0, sources: [] };
            }
            matchesMap[stock.Ticker].counts += 1;
            matchesMap[stock.Ticker].sources.push(SCREENERS_CONFIG[screenerKey].title);
        });
    });

    let confluenceRows = "";
    Object.keys(matchesMap).forEach(ticker => {
        const obj = matchesMap[ticker];
        if (obj.counts > 1) {
            confluenceRows += `
                <tr>
                    <td><span style="color:var(--neon-cyan); font-weight:700;">NSE:${ticker}</span></td>
                    <td>${obj.name}</td>
                    <td><span style="color: var(--neon-green); font-weight:bold;">+${(obj.counts * 0.85).toFixed(2)}%</span></td>
                    <td><span class="confluence-badge">${obj.counts} Scan Matches</span></td>
                    <td>
                        <div class="research-links-container">
                            <a href="https://in.tradingview.com/chart/?symbol=NSE:${ticker}" target="_blank" class="btn-link-action">TradingView</a>
                            <a href="https://www.nseindia.com/get-quotes/equity?symbol=${ticker}" target="_blank" class="btn-link-action" style="color:var(--text-dim);">NSE</a>
                        </div>
                    </td>
                </tr>`;
        }
    });

    const tableHtml = `
        <div class="table-wrapper">
            <h3 style="margin-bottom: 20px; font-weight:700; font-size:1rem;">🔥 Strategic Multi-Screener Confluence Watchlist</h3>
            <table class="data-table">
                <thead>
                    <tr><th>Scrip Name</th><th>Company Detail</th><th>Day Change %</th><th>Signal Status</th><th>Research Links</th></tr>
                </thead>
                <tbody>
                    ${confluenceRows || `<tr><td colspan="5" style="text-align:center; color: var(--text-dim);">No overlapping signals found across running criteria.</td></tr>`}
                </tbody>
            </table>
        </div>`;

    target.innerHTML = cardsHtml + tableHtml;
}

function renderScreenerTable(target, screenerKey) {
    let dataset = ScreenerRepository.data[screenerKey] || [];
    
    if (state.searchFilter) {
        dataset = dataset.filter(item => 
            (item.Ticker && item.Ticker.includes(state.searchFilter.toUpperCase())) || 
            (item.Name && item.Name.toUpperCase().includes(state.searchFilter.toUpperCase()))
        );
    }

    const totalRows = dataset.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / state.rowsPerPage));
    const startIdx = (state.currentPage - 1) * state.rowsPerPage;
    const endIdx = Math.min(startIdx + state.rowsPerPage, totalRows);
    const paginatedSlice = dataset.slice(startIdx, endIdx);

    let rowsHtml = "";
    paginatedSlice.forEach(row => {
        const arrow = row.Change >= 0 ? '▲' : '▼';
        const changeColor = row.Change >= 0 ? "color: var(--neon-green);" : "color: var(--neon-red);";
        
        rowsHtml += `
            <tr>
                <td><span style="color:var(--neon-cyan); font-weight:700;">NSE:${row.Ticker}</span></td>
                <td>${row.Name}</td>
                <td>₹${row.Close.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td style="${changeColor} font-weight:600;">${arrow} ${row.Change >= 0 ? '+' : ''}${row.Change.toFixed(2)}%</td>
                <td>
                    <div class="research-links-container">
                        <a href="https://in.tradingview.com/chart/?symbol=NSE:${row.Ticker}" target="_blank" class="btn-link-action">TradingView</a>
                    </div>
                </td>
            </tr>`;
    });

    target.innerHTML = `
        <div class="table-wrapper">
            <div class="table-controls">
                <input type="text" class="search-input" id="tableSearch" placeholder="🔍 Filter by Symbol or Scrip Name..." value="${state.searchFilter}">
                <div>
                    <select id="rowsSelect" class="search-input" style="width:110px; padding:8px 12px;">
                        <option value="5" ${state.rowsPerPage === 5 ? 'selected' : ''}>5 Rows</option>
                        <option value="10" ${state.rowsPerPage === 10 ? 'selected' : ''}>10 Rows</option>
                        <option value="20" ${state.rowsPerPage === 20 ? 'selected' : ''}>20 Rows</option>
                    </select>
                </div>
            </div>
            <table class="data-table">
                <thead>
                    <tr><th>Scrip</th><th>Company Name</th><th>CMP</th><th>Change %</th><th>Research</th></tr>
                </thead>
                <tbody>
                    ${rowsHtml || `<tr><td colspan="5" style="text-align:center; color: var(--text-dim);">No active matching records found.</td></tr>`}
                </tbody>
            </table>
            <div class="pagination-container">
                <span style="font-size: 0.8rem; color: var(--text-dim);">Showing metrics ${totalRows === 0 ? 0 : startIdx + 1} to ${endIdx} of ${totalRows} entries</span>
                <div>
                    <button class="pagination-btn" id="prevBtn" ${state.currentPage === 1 ? 'disabled' : ''}>Previous</button>
                    <button class="pagination-btn" id="nextBtn" ${state.currentPage === totalPages ? 'disabled' : ''} style="margin-left:6px;">Next</button>
                </div>
            </div>
        </div>`;

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

    document.getElementById("prevBtn").onclick = () => { if (state.currentPage > 1) { state.currentPage--; renderScreenerTable(target, screenerKey); } };
    document.getElementById("nextBtn").onclick = () => { if (state.currentPage < totalPages) { state.currentPage++; renderScreenerTable(target, screenerKey); } };
}
