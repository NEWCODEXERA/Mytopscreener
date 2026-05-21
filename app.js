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
                ? 'bg-blue-400 text-white shadow-md' 
                : 'text-blue-100 hover:bg-blue-500 hover:text-white'
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
                ? 'bg-blue-400 text-white shadow-md' 
                : 'text-blue-100 hover:bg-blue-500 hover:text-white'
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
        { label: 'Scanned Assets', value: countGSheet + countRsi + countMa, bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', icon: '📊' },
        { label: 'Buy Signals', value: countRsi, bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', icon: '📈' },
        { label: 'Hold Zone', value: countMa, bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', icon: '⏸️' },
        { label: 'Avoid Zone', value: countRs, bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', icon: '⛔' }
    ];

    let cardsHtml = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">`;
    cards.forEach(card => {
        cardsHtml += `
            <div class="bg-white border-2 ${card.border} ${card.bg} p-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xs font-bold tracking-widest ${card.text} uppercase">${card.label}</h3>
                    <span class="text-2xl">${card.icon}</span>
                </div>
                <div class="text-4xl font-black ${card.text}">${card.value}</div>
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
                <tr class="border-b border-gray-200 hover:bg-blue-100 transition-colors">
                    <td class="px-6 py-4"><span class="text-blue-700 font-bold text-lg">NSE:${ticker}</span></td>
                    <td class="px-6 py-4 text-gray-800 font-medium">${obj.name}</td>
                    <td class="px-6 py-4"><span class="text-green-700 font-bold text-lg">+${(obj.counts * 0.85).toFixed(2)}%</span></td>
                    <td class="px-6 py-4"><span class="px-3 py-1 bg-green-200 text-green-800 text-xs font-bold rounded-full">${obj.counts} Matches</span></td>
                    <td class="px-6 py-4">
                        <div class="flex gap-2">
                            <a href="https://in.tradingview.com/chart/?symbol=NSE:${ticker}" target="_blank" class="px-3 py-1 bg-blue-200 hover:bg-blue-300 text-blue-800 text-xs font-semibold rounded transition-all border border-blue-400 shadow-sm">TradingView</a>
                            <a href="https://www.nseindia.com/get-quotes/equity?symbol=${ticker}" target="_blank" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded transition-all border border-gray-400 shadow-sm">NSE</a>
                        </div>
                    </td>
                </tr>`;
        }
    });

    const tableHtml = `
        <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">🔥 Strategic Multi-Screener Confluence</h3>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b-2 border-gray-400 bg-gray-200">
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-900 uppercase">Scrip</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-900 uppercase">Company</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-900 uppercase">Change %</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-900 uppercase">Status</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-900 uppercase">Research</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${confluenceRows || `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-600 font-medium">No overlapping signals found</td></tr>`}
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
        const changeClass = row.Change >= 0 ? 'text-green-700 font-bold' : 'text-red-700 font-bold';
        
        rowsHtml += `
            <tr class="border-b border-gray-200 hover:bg-blue-100 transition-colors">
                <td class="px-6 py-4"><span class="text-blue-700 font-bold text-lg">${row.Ticker}</span></td>
                <td class="px-6 py-4 text-gray-800 font-medium">${row.Name}</td>
                <td class="px-6 py-4 font-mono text-gray-900 font-semibold">₹${row.Close.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td class="px-6 py-4 text-lg ${changeClass}">${arrow} ${row.Change >= 0 ? '+' : ''}${row.Change.toFixed(2)}%</td>
                <td class="px-6 py-4">
                    <a href="https://in.tradingview.com/chart/?symbol=NSE:${row.Ticker}" target="_blank" class="px-3 py-1 bg-blue-200 hover:bg-blue-300 text-blue-800 text-xs font-semibold rounded transition-all border border-blue-400 shadow-sm">View Chart</a>
                </td>
            </tr>`;
    });

    target.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div class="flex justify-between items-center gap-4">
                <input type="text" id="tableSearch" placeholder="🔍 Search by Symbol or Company..." value="${state.searchFilter}" class="flex-1 px-4 py-2 bg-gray-100 border border-gray-400 rounded-lg text-gray-900 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-300 transition-colors font-medium">
                <select id="rowsSelect" class="px-4 py-2 bg-gray-100 border border-gray-400 rounded-lg text-gray-900 text-sm font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-300 transition-colors">
                    <option value="5" ${state.rowsPerPage === 5 ? 'selected' : ''}>5 Rows</option>
                    <option value="10" ${state.rowsPerPage === 10 ? 'selected' : ''}>10 Rows</option>
                    <option value="20" ${state.rowsPerPage === 20 ? 'selected' : ''}>20 Rows</option>
                </select>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b-2 border-gray-400 bg-gray-200">
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-900 uppercase">Scrip</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-900 uppercase">Company</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-900 uppercase">Price</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-900 uppercase">Change</th>
                            <th class="text-left px-6 py-3 text-xs font-bold tracking-widest text-gray-900 uppercase">Research</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-600 font-medium">No matching records found</td></tr>`}
                    </tbody>
                </table>
            </div>

            <div class="flex justify-between items-center pt-4 border-t border-gray-300">
                <span class="text-xs text-gray-700 font-medium">Showing ${totalRows === 0 ? 0 : startIdx + 1} to ${endIdx} of ${totalRows} entries</span>
                <div class="flex gap-2">
                    <button id="prevBtn" ${state.currentPage === 1 ? 'disabled' : ''} class="px-4 py-2 bg-gray-200 border border-gray-400 rounded-lg text-gray-800 text-sm font-semibold hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">← Previous</button>
                    <button id="nextBtn" ${state.currentPage === totalPages ? 'disabled' : ''} class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md">Next →</button>
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
