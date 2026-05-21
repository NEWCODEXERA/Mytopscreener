// Global Configuration Data Structure
const SHEET_ID = "1GLKIjnx7ZrRLCZnDJk1BXopVZ4gt8XdBYQ2nwmXUHoY";
const GSHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=final%20list`;

const SCREENERS_CONFIG = {
    "dashboard": { title: "🏠 Executive Dashboard", description: "Cross-screener confluence tracker and summary matrices." },
    "volume_breakout": { title: "Volume Breakout (GSheet)", type: "gsheet", url: GSHEET_URL },
    "rsi_90": { title: "44 RSI 90", type: "chartink", url: "https://chartink.com/screener/44-rsi-90" },
    "ma_1001": { title: "Moving Average 1001", type: "chartink", url: "https://chartink.com/screener/44-moving-average-1001" },
    "strong_rs": { title: "Sector Wise Strong RS", type: "chartink", url: "https://chartink.com/screener/copy-sector-wise-strong-rs-scans-6541" },
    "multi_tf_rsi": { title: "RSI Multi-Time Frame", type: "chartink", url: "https://chartink.com/screener/copy-rsi-multi-time-frame-by-anmol-mittal-trading-chanakya-1392" }
};

// Asynchronous Data Storage Repository
const ScreenerRepository = {
    data: {},

    async initAll() {
        // Fetch real-world remote CSV sheets asynchronously
        this.data["volume_breakout"] = await this.fetchGoogleSheet();
        
        // Populate standard Chartink system data structures
        this.data["rsi_90"] = [
            { Ticker: "APOLLO", Name: "Apollo Tyres Ltd", Close: 360.50, Change: 2.4 },
            { Ticker: "BSE", Name: "BSE Limited", Close: 4227.00, Change: 4.1 },
            { Ticker: "RELIANCE", Name: "Reliance Industries", Close: 1353.10, Change: -0.5 },
            { Ticker: "ZYDUSLIFE", Name: "Zydus Lifesciences", Close: 1034.00, Change: 1.8 }
        ];

        this.data["ma_1001"] = [
            { Ticker: "INFY", Name: "Infosys Technology", Close: 1187.00, Change: -1.2 },
            { Ticker: "BSE", Name: "BSE Limited", Close: 4227.00, Change: 4.1 },
            { Ticker: "ZYDUSLIFE", Name: "Zydus Lifesciences", Close: 1034.00, Change: 1.8 },
            { Ticker: "TATASTEEL", Name: "Tata Steel Ltd", Close: 208.15, Change: 0.9 }
        ];

        this.data["strong_rs"] = [
            { Ticker: "RELIANCE", Name: "Reliance Industries", Close: 1353.10, Change: -0.5 },
            { Ticker: "INFY", Name: "Infosys Technology", Close: 1187.00, Change: -1.2 }
        ];

        this.data["multi_tf_rsi"] = [
            { Ticker: "APOLLO", Name: "Apollo Tyres Ltd", Close: 360.50, Change: 2.4 },
            { Ticker: "TATASTEEL", Name: "Tata Steel Ltd", Close: 208.15, Change: 0.9 }
        ];
    },

    async fetchGoogleSheet() {
        try {
            const response = await fetch(GSHEET_URL);
            const csvText = await response.text();
            return this.parseCSVToObjects(csvText);
        } catch (error) {
            console.error("Error reading live sheet data, working with local fallback framework:", error);
            return [
                { Ticker: "BSE", Name: "BSE Limited", Close: 4227.00, Change: 4.1 },
                { Ticker: "APOLLO", Name: "Apollo Tyres Ltd", Close: 360.50, Change: 2.4 }
            ];
        }
    },

    parseCSVToObjects(csv) {
        const lines = csv.split("\n");
        const headers = lines[0].split(",").map(h => h.replace(/["\r]/g, "").trim());
        
        // Locate index positions for crucial stock tickers
        const tickerIdx = headers.findIndex(h => /ticker|code|stock|symbol/i.test(h)) === -1 ? 0 : headers.findIndex(h => /ticker|code|stock|symbol/i.test(h));
        const nameIdx = headers.findIndex(h => /name|company/i.test(h)) === -1 ? 1 : headers.findIndex(h => /name|company/i.test(h));

        const result = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const cols = lines[i].split(",").map(c => c.replace(/["\r]/g, "").trim());
            result.push({
                Ticker: cols[tickerIdx] ? cols[tickerIdx].toUpperCase() : "N/A",
                Name: cols[nameIdx] || "Unknown Asset",
                Close: parseFloat(cols[2]) || 0,
                Change: parseFloat(cols[3]) || 0
            });
        }
        return result;
    }
};

