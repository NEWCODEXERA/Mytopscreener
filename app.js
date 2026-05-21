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
        const isActive = state.activeTab === key;
        btn.className = `w-full text-left px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
            isActive 
                ? 'bg-neon-green bg-opacity-15 text-neon-green border border-neon-green border-opacity-30' 
                : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-5'
        }`;
        btn.innerText = SCREENERS_CONFIG[key].title;
        btn.onclick = () => switchPage(key);
        menu.appendChild(btn);
    });
}

function switchPage(pageKey) {
    state.activeTab = pageKey;
    state.searchFilter = "";
    state.currentPage = 1;
    
    document.querySelectorAll("#navMenu button").forEach((btn) => {
        const isActive = SCREENERS_CONFIG[pageKey] && btn.innerText === SCREENERS_CONFIG[pageKey].title;
        btn.className = `w-full text-left px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
            isActive 
                ? 'bg-neon-green bg-opacity-15 text-neon-green border border-neon-green border-opacity-30' 
                : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-5'
        }`;
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

    const cards = [
        { label: 'Scanned Assets', value: countGSheet + countRsi + countMa, color: 'cyan' },
        { label: 'Buy Signals', value: countRsi, color: 'green' },
        { label: 'Hold Zone', value: countMa, color: 'yellow' },
        { label: 'Avoid Zone', value: countRs, color: 'red' }
    ];

    const colorMap = {
        cyan: 'border-t-2 border-neon-cyan',
        green: 'border-t-2 border-neon-green',
        yellow: 'border-t-2 border-neon-yellow',
        red: 'border-t-2 border-neon-red'
    };

    let cardsHtml = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">`;
    cards.forEach(card => {
        cardsHtml += `
            <div class="glass-effect p-6 rounded-xl ${colorMap[card.color]} hover:shadow-lg hover:shadow-opacity-50 transition-all">
                <h3 class="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">${card.label}</h3>
                <div class="text-4xl font-black text-white">${card.value}</div>
            </div>`;
    });
    cardsHtml += `</div>`;

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
                <tr class="border-b border-cyber-border hover:bg-white hover:bg-opacity-5 transition-colors">
                    <td class="px-6 py-4"><span class="text-neon-cyan font-bold">NSE:${ticker}</span></td>
                    <td class="px-6 py-4 text-gray-300">${obj.name}</td>
                    <td class="px-6 py-4"><span class="text-neon-green font-bold">+${(obj.counts * 0.85).toFixed(2)}%</span></td>
                    <td class="px-6 py-4"><span class="px-3 py-1 bg-neon-green bg-opacity-15 text-neon-green text-xs font-bold rounded-full">${obj.counts} Matches</span></td>
                    <td class="px-6 py-4">
                        <div class="flex gap-2">
                            <a href="https://in.tradingview.com/chart/?symbol=NSE:${ticker}" target="_blank" class="px-3 py-1 bg-white bg-opacity-5 hover:bg-opacity-10 text-blue-400 text-xs font-semibold rounded transition-all border border-white border-opacity-10">TradingView</a>
                            <a href="https://www.nseindia.com/get-quotes/equity?symbol=${ticker}" target="_blank" class="px-3 py-1 bg-white bg-opacity-5 hover:bg-opacity-10 text-gray-400 text-xs font-semibold rounded transition-all border border-white border-opacity-10">NSE</a>
                        </div>
                    </td>
                </tr>`;
        }
    });

    const tableHtml = `
        <div class="glass-effect rounded-xl p-6">
            <h3 class="text-lg font-bold mb-6 text-white flex items-center gap-2">🔥 Strategic Multi-Screener Confluence</h3>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b border-cyber-border">
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase">Scrip</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase">Company</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase">Change %</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase">Status</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase">Research</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${confluenceRows || `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No overlapping signals found</td></tr>`}
                    </tbody>
                </table>
            </div>
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
        const changeClass = row.Change >= 0 ? 'text-neon-green' : 'text-neon-red';
        
        rowsHtml += `
            <tr class="border-b border-cyber-border hover:bg-white hover:bg-opacity-5 transition-colors">
                <td class="px-6 py-4"><span class="text-neon-cyan font-bold">NSE:${row.Ticker}</span></td>
                <td class="px-6 py-4 text-gray-300">${row.Name}</td>
                <td class="px-6 py-4 font-mono">₹${row.Close.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td class="px-6 py-4 font-bold ${changeClass}">${arrow} ${row.Change >= 0 ? '+' : ''}${row.Change.toFixed(2)}%</td>
                <td class="px-6 py-4">
                    <a href="https://in.tradingview.com/chart/?symbol=NSE:${row.Ticker}" target="_blank" class="px-3 py-1 bg-white bg-opacity-5 hover:bg-opacity-10 text-blue-400 text-xs font-semibold rounded transition-all border border-white border-opacity-10">View Chart</a>
                </td>
            </tr>`;
    });

    target.innerHTML = `
        <div class="glass-effect rounded-xl p-6 space-y-4">
            <div class="flex justify-between items-center gap-4">
                <input type="text" id="tableSearch" placeholder="🔍 Search by Symbol or Company..." value="${state.searchFilter}" class="flex-1 px-4 py-2 bg-black bg-opacity-30 border border-cyber-border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon-cyan transition-colors">
                <select id="rowsSelect" class="px-4 py-2 bg-black bg-opacity-30 border border-cyber-border rounded-lg text-white text-sm focus:outline-none focus:border-neon-cyan transition-colors">
                    <option value="5" ${state.rowsPerPage === 5 ? 'selected' : ''}>5 Rows</option>
                    <option value="10" ${state.rowsPerPage === 10 ? 'selected' : ''}>10 Rows</option>
                    <option value="20" ${state.rowsPerPage === 20 ? 'selected' : ''}>20 Rows</option>
                </select>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b border-cyber-border">
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase">Scrip</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase">Company</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase">Price</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase">Change</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase">Research</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No matching records found</td></tr>`}
                    </tbody>
                </table>
            </div>

            <div class="flex justify-between items-center pt-4 border-t border-cyber-border">
                <span class="text-xs text-gray-500">Showing ${totalRows === 0 ? 0 : startIdx + 1} to ${endIdx} of ${totalRows} entries</span>
                <div class="flex gap-2">
                    <button id="prevBtn" ${state.currentPage === 1 ? 'disabled' : ''} class="px-4 py-2 bg-white bg-opacity-5 border border-cyber-border rounded-lg text-white text-sm font-semibold hover:bg-opacity-10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">← Previous</button>
                    <button id="nextBtn" ${state.currentPage === totalPages ? 'disabled' : ''} class="px-4 py-2 bg-white bg-opacity-5 border border-cyber-border rounded-lg text-white text-sm font-semibold hover:bg-opacity-10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">Next →</button>
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
