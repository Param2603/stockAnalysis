import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Activity, Globe, DollarSign, Wallet,
  Newspaper, BookOpen, ShieldCheck, RefreshCw, Moon, Sun, Search,
  X, ArrowUpRight, ArrowDownRight, ExternalLink, Info,
  AlertTriangle, Layers, BarChart2, Landmark, Zap
} from "lucide-react";

// Robust API client with auto-fallback to relative /api or direct localhost:8000
async function fetchFromApi(path, options = {}) {
  const isViteDev = window.location.port !== "8000";
  const candidates = isViteDev
    ? ["/api" + path, "http://localhost:8000/api" + path, "http://127.0.0.1:8000/api" + path]
    : ["http://localhost:8000/api" + path, "/api" + path];

  let lastError = null;
  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, { ...options, credentials: "omit", signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        return await res.json();
      }
      lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Failed to connect to market server");
}

function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  const refetch = () => {
    setLoading(true);
    setError(null);
    setVersion((v) => v + 1);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchFromApi(path)
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to fetch data");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [path, version, ...deps]);

  return { data, loading, error, refetch };
}

// Formatting utilities
const pct = (v) => {
  if (v == null || isNaN(v)) return "-";
  const num = Number(v);
  return `${num > 0 ? "+" : ""}${num.toFixed(2)}%`;
};

const inr = (v) => {
  if (v == null || isNaN(v)) return "-";
  return "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const fmtTime = (iso) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return iso;
  }
};

const TABS = [
  { id: "Indices", label: "Market Indices", icon: Activity },
  { id: "Indian Stocks", label: "Indian Equities", icon: TrendingUp },
  { id: "Global Stocks", label: "Global Equities", icon: Globe },
  { id: "Commodities", label: "Commodities", icon: Layers },
  { id: "Crypto", label: "Crypto Assets", icon: DollarSign },
  { id: "FII / DII", label: "FII / DII Institutional", icon: Landmark },
  { id: "Options (F&O)", label: "Options (F&O) Chain", icon: BarChart2 },
  { id: "Paper Trade", label: "Virtual Brokerage", icon: Wallet },
  { id: "News", label: "Live News Wire", icon: Newspaper },
  { id: "Policy", label: "Govt & RBI Policy", icon: ShieldCheck },
  { id: "Learn", label: "Trading Academy", icon: BookOpen },
];

const PAPER_TICKERS = [
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS",
  "ICICIBANK.NS", "SBIN.NS", "ITC.NS", "LT.NS",
  "BHARTIARTL.NS", "KOTAKBANK.NS", "TATAMOTORS.NS"
];

// Status badge dictionary
const BADGE_CONFIG = {
  live: { color: "var(--gain)", bg: "var(--gain-bg)", label: "Live Automated Stream" },
  cached: { color: "var(--accent-amber)", bg: "rgba(245, 158, 11, 0.12)", label: "Cached Feed (Last Known Good)" },
  stale: { color: "var(--loss)", bg: "var(--loss-bg)", label: "Stale Stream" },
  manual: { color: "var(--accent-blue)", bg: "rgba(59, 130, 246, 0.12)", label: "Manual Input Mode" },
  manual_update_needed: { color: "var(--loss)", bg: "var(--loss-bg)", label: "Offline Stream - Fallback Active" },
};

function StatusIndicator({ res }) {
  if (!res) return null;
  const cfg = BADGE_CONFIG[res.status] || BADGE_CONFIG.manual_update_needed;
  const hasManual = res.status !== "live";

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.color}`,
      borderLeftWidth: "4px",
      borderRadius: "var(--radius-md)",
      padding: "12px 16px",
      margin: "0 0 18px",
      fontSize: "13px",
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.color }} />
        <b style={{ color: cfg.color }}>{cfg.label}</b>
        {res.updated_at && (
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            · Updated: {fmtTime(res.updated_at)}
          </span>
        )}
      </div>
      {hasManual && res.error && (
        <div style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
          <b>Diagnostic:</b> {res.error}
        </div>
      )}
      {hasManual && res.instructions && (
        <div style={{ color: "var(--text-secondary)", fontSize: "12px", lineHeight: "1.4" }}>
          {res.instructions}
        </div>
      )}
      {hasManual && res.source_url && (
        <div style={{ marginTop: "2px" }}>
          <a
            href={res.source_url}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent-blue)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600" }}
          >
            Direct Verification Source <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  );
}

// Live Marquee Ticker Tape Ribbon
function LiveTickerTape({ onSelect }) {
  const { data } = useFetch("/overview");
  const items = useMemo(() => {
    if (!data) return [];
    const all = [
      ...(data.indices || []),
      ...(data.commodities || []),
      ...(data.crypto || []),
    ];
    return all.filter((x) => x.price != null);
  }, [data]);

  if (!items.length) {
    return (
      <div className="ticker-tape-container">
        <div style={{ padding: "0 24px", color: "var(--text-muted)", fontSize: "12px" }}>
          Connecting to Vortex Pro global market feeds...
        </div>
      </div>
    );
  }

  // Duplicate for seamless infinite loop
  const tapeList = [...items, ...items];

  return (
    <div className="ticker-tape-container">
      <div className="ticker-tape-content">
        {tapeList.map((item, idx) => {
          const isUp = (item.ret_1d || 0) >= 0;
          return (
            <div
              key={`${item.ticker}-${idx}`}
              className="ticker-item"
              onClick={() => onSelect(item.ticker)}
              title="Click to view detailed chart & technical analysis"
            >
              <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>{item.name}</span>
              <span className="mono" style={{ color: "var(--text-secondary)" }}>
                {item.price?.toLocaleString()}
              </span>
              <span
                className="mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  color: isUp ? "var(--gain)" : "var(--loss)",
                  fontWeight: "700",
                  fontSize: "12px",
                }}
              >
                {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {pct(item.ret_1d)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Header & Command Bar
function Header({ theme, toggleTheme, onRefresh, onSelectTicker }) {
  const [status, setStatus] = useState(null);
  const { data: overviewData } = useFetch("/overview");

  useEffect(() => {
    const fetchStatus = () => {
      fetchFromApi("/market-status")
        .then(setStatus)
        .catch(() => {});
    };
    fetchStatus();
    const timer = setInterval(fetchStatus, 30000);
    return () => clearInterval(timer);
  }, []);

  const isOpen = status?.nse_open;

  // Top quick indices
  const topIndices = useMemo(() => {
    if (!overviewData?.indices) return [];
    return overviewData.indices.slice(0, 3);
  }, [overviewData]);

  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-logo">
          <Zap size={22} strokeWidth={2.5} />
        </div>
        <div>
          <div className="brand-title">
            VORTEX <span className="pro-badge">PRO</span>
          </div>
          <div className="brand-subtitle">Dalal & Wall Street • Institutional Suite</div>
        </div>
      </div>

      {/* Header Quick Indices */}
      {topIndices.length > 0 && (
        <div className="header-indices">
          {topIndices.map((idx) => {
            const isUp = (idx.ret_1d || 0) >= 0;
            return (
              <div
                key={idx.ticker}
                className="index-pill"
                onClick={() => onSelectTicker(idx.ticker)}
                title="Inspect index chart & technicals"
              >
                <span style={{ fontWeight: "700" }}>{idx.name}</span>
                <span className="mono" style={{ color: "var(--text-primary)", fontWeight: "600" }}>
                  {idx.price?.toLocaleString()}
                </span>
                <span
                  className="mono"
                  style={{
                    color: isUp ? "var(--gain)" : "var(--loss)",
                    fontWeight: "700",
                    fontSize: "11.5px",
                    display: "inline-flex",
                    alignItems: "center"
                  }}
                >
                  {isUp ? "▲" : "▼"} {pct(idx.ret_1d)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        {status && (
          <div className="market-status-pill">
            <span className={`status-dot ${isOpen ? "open" : "closed"}`} />
            <span style={{ color: isOpen ? "var(--gain)" : "var(--loss)" }}>
              NSE {isOpen ? "LIVE" : "CLOSED"}
            </span>
            <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>
              {status.time_ist}
            </span>
          </div>
        )}

        <button
          className="btn-secondary"
          onClick={onRefresh}
          title="Refresh All Market Feeds"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={14} /> Refresh
        </button>

        <button
          className="btn-secondary"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          style={{ padding: "8px 10px" }}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}

// Skeleton Table Loader
function TableSkeleton({ cols = 8, rows = 6 }) {
  return (
    <div className="table-card">
      <div style={{ padding: "20px" }}>
        <div className="skeleton" style={{ height: "24px", width: "35%", marginBottom: "16px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} style={{ display: "flex", gap: "12px" }}>
              {Array.from({ length: cols }).map((_, c) => (
                <div key={c} className="skeleton" style={{ height: "22px", flex: c === 0 ? 2 : 1 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Error Banner with Retry
function ErrorState({ message, onRetry }) {
  return (
    <div className="banner-alert error">
      <AlertTriangle size={20} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: "700", marginBottom: "4px" }}>Data Stream Alert</div>
        <div style={{ fontSize: "13px", opacity: 0.9 }}>{message}</div>
      </div>
      {onRetry && (
        <button
          className="btn-secondary"
          onClick={onRetry}
          style={{ background: "transparent", color: "inherit", borderColor: "currentColor" }}
        >
          Retry Connection
        </button>
      )}
    </div>
  );
}

// Quick Overview Cards Row
function OverviewCardsRow({ onSelect }) {
  const { data } = useFetch("/overview");
  if (!data?.indices?.length) return null;

  const keyAssets = [
    ...(data.indices.slice(0, 3)),
    ...(data.commodities?.filter((c) => c.name === "Gold" || c.name === "WTI Crude") || []),
    ...(data.crypto?.filter((c) => c.name === "Bitcoin") || []),
  ];

  return (
    <div className="overview-cards-row">
      {keyAssets.map((asset) => {
        const isUp = (asset.ret_1d || 0) >= 0;
        return (
          <div
            key={asset.ticker}
            className={`overview-card ${isUp ? "up" : "down"}`}
            onClick={() => onSelect(asset.ticker)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>
                {asset.name}
              </span>
              <span className={`badge-ret ${isUp ? "positive" : "negative"}`} style={{ fontSize: "11px", padding: "2px 6px" }}>
                {isUp ? "▲" : "▼"} {pct(asset.ret_1d)}
              </span>
            </div>
            <div className="mono" style={{ fontSize: "19px", fontWeight: "800", color: "var(--text-primary)" }}>
              {asset.price?.toLocaleString()}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "var(--text-muted)" }}>
              <span>1M: <b style={{ color: asset.ret_1m >= 0 ? "var(--gain)" : "var(--loss)" }}>{pct(asset.ret_1m)}</b></span>
              <span>RSI: <b>{asset.rsi ?? "-"}</b></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Native Interactive SVG Financial Price Chart (Zero External Dependency - React 19 Ready)
function InteractivePriceChart({ history }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showSma50, setShowSma50] = useState(true);
  const [showSma200, setShowSma200] = useState(true);

  if (!history || !history.length) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        No historical price series available for this asset.
      </div>
    );
  }

  const width = 840;
  const height = 300;
  const padLeft = 65;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Compute scale boundaries
  const allValues = history.flatMap((h) => [
    h.close,
    showSma50 ? h.sma50 : null,
    showSma200 ? h.sma200 : null,
  ]).filter((v) => v != null && !isNaN(v));

  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const yMin = minVal - range * 0.05;
  const yMax = maxVal + range * 0.05;
  const yRange = yMax - yMin;

  const getX = (idx) => padLeft + (idx / (history.length - 1)) * chartW;
  const getY = (val) => padTop + chartH - ((val - yMin) / yRange) * chartH;

  // Paths
  const closePoints = history.map((h, i) => `${getX(i).toFixed(1)},${getY(h.close).toFixed(1)}`);
  const closePath = `M ${closePoints.join(" L ")}`;
  const closeArea = `M ${closePoints[0]} L ${closePoints.join(" L ")} L ${getX(history.length - 1).toFixed(1)},${padTop + chartH} L ${padLeft},${padTop + chartH} Z`;

  const sma50Valid = history.map((h, i) => (h.sma50 != null ? [getX(i), getY(h.sma50)] : null)).filter(Boolean);
  const sma50Path = sma50Valid.length ? `M ${sma50Valid.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ")}` : "";

  const sma200Valid = history.map((h, i) => (h.sma200 != null ? [getX(i), getY(h.sma200)] : null)).filter(Boolean);
  const sma200Path = sma200Valid.length ? `M ${sma200Valid.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ")}` : "";

  // Y-axis ticks
  const yTicks = [0, 0.33, 0.66, 1].map((p) => {
    const val = yMin + p * yRange;
    const yPos = padTop + chartH - p * chartH;
    return { val, yPos };
  });

  // X-axis date labels
  const xIndices = [
    0,
    Math.floor(history.length * 0.25),
    Math.floor(history.length * 0.5),
    Math.floor(history.length * 0.75),
    history.length - 1,
  ];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relX = clientX / rect.width;
    const approxIndex = Math.round(relX * (history.length - 1));
    if (approxIndex >= 0 && approxIndex < history.length) {
      setHoverIndex(approxIndex);
    }
  };

  const activeItem = hoverIndex != null ? history[hoverIndex] : history[history.length - 1];
  const activeX = hoverIndex != null ? getX(hoverIndex) : null;

  return (
    <div>
      {/* Chart Legend & Toggles */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12.5px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#3b82f6" }} />
            <b>Close:</b> <span className="mono" style={{ color: "var(--text-primary)", fontWeight: "700" }}>{activeItem?.close?.toLocaleString()}</span>
          </span>

          <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showSma50}
              onChange={(e) => setShowSma50(e.target.checked)}
              style={{ accentColor: "#f59e0b" }}
            />
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
            <span style={{ color: "var(--text-secondary)" }}>50-DMA:</span>
            <span className="mono" style={{ color: "#f59e0b", fontWeight: "600" }}>{activeItem?.sma50 != null ? activeItem.sma50.toLocaleString() : "-"}</span>
          </label>

          <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showSma200}
              onChange={(e) => setShowSma200(e.target.checked)}
              style={{ accentColor: "#8b5cf6" }}
            />
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#8b5cf6" }} />
            <span style={{ color: "var(--text-secondary)" }}>200-DMA:</span>
            <span className="mono" style={{ color: "#8b5cf6", fontWeight: "600" }}>{activeItem?.sma200 != null ? activeItem.sma200.toLocaleString() : "-"}</span>
          </label>
        </div>

        <div className="mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {activeItem?.date ? `Date: ${activeItem.date}` : ""}
        </div>
      </div>

      {/* SVG Container */}
      <div
        style={{
          background: "var(--bg-app)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "10px 14px",
          position: "relative",
          cursor: "crosshair",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={t.yPos}
                x2={width - padRight}
                y2={t.yPos}
                stroke="rgba(255, 255, 255, 0.07)"
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 8}
                y={t.yPos + 4}
                textAnchor="end"
                fill="var(--text-muted)"
                fontSize="11"
                fontFamily="var(--font-mono)"
              >
                {t.val >= 1000 ? t.val.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : t.val.toFixed(2)}
              </text>
            </g>
          ))}

          {/* X-axis date labels */}
          {xIndices.map((idx) => {
            const h = history[idx];
            if (!h) return null;
            const xPos = getX(idx);
            return (
              <text
                key={idx}
                x={xPos}
                y={height - 10}
                textAnchor={idx === 0 ? "start" : idx === history.length - 1 ? "end" : "middle"}
                fill="var(--text-muted)"
                fontSize="11"
                fontFamily="var(--font-mono)"
              >
                {h.date ? h.date.slice(5) : ""}
              </text>
            );
          })}

          {/* Area fill */}
          <path d={closeArea} fill="url(#priceGradient)" />

          {/* Lines */}
          {showSma200 && sma200Path && (
            <path
              d={sma200Path}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          )}

          {showSma50 && sma50Path && (
            <path
              d={sma50Path}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
          )}

          <path
            d={closePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.2"
            filter="url(#glow)"
          />

          {/* Hover crosshair & points */}
          {activeX != null && activeItem && (
            <g>
              <line
                x1={activeX}
                y1={padTop}
                x2={activeX}
                y2={padTop + chartH}
                stroke="rgba(255, 255, 255, 0.35)"
                strokeDasharray="3 3"
              />
              <circle
                cx={activeX}
                cy={getY(activeItem.close)}
                r="5"
                fill="#3b82f6"
                stroke="#fff"
                strokeWidth="2"
              />
              {showSma50 && activeItem.sma50 != null && (
                <circle
                  cx={activeX}
                  cy={getY(activeItem.sma50)}
                  r="4"
                  fill="#f59e0b"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              )}
              {showSma200 && activeItem.sma200 != null && (
                <circle
                  cx={activeX}
                  cy={getY(activeItem.sma200)}
                  r="4"
                  fill="#8b5cf6"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              )}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

// Native Interactive SVG RSI Oscillator Chart
function InteractiveRsiChart({ history }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!history || !history.length) return null;

  const width = 840;
  const height = 130;
  const padLeft = 65;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 20;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getX = (idx) => padLeft + (idx / (history.length - 1)) * chartW;
  const getY = (val) => padTop + chartH - (val / 100) * chartH;

  const validRsi = history.map((h, i) => (h.rsi != null ? [getX(i), getY(h.rsi)] : null)).filter(Boolean);
  const rsiPath = validRsi.length ? `M ${validRsi.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ")}` : "";

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relX = clientX / rect.width;
    const approxIndex = Math.round(relX * (history.length - 1));
    if (approxIndex >= 0 && approxIndex < history.length) {
      setHoverIndex(approxIndex);
    }
  };

  const activeItem = hoverIndex != null ? history[hoverIndex] : history[history.length - 1];
  const activeX = hoverIndex != null ? getX(hoverIndex) : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)", margin: 0, letterSpacing: "0.05em" }}>
          Relative Strength Index (RSI 14)
        </h4>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Indicator: <b style={{ color: (activeItem?.rsi || 50) > 70 ? "var(--loss)" : (activeItem?.rsi || 50) < 30 ? "var(--gain)" : "var(--accent-cyan)" }}>
            {activeItem?.rsi ?? "-"}
          </b> {(activeItem?.rsi || 50) > 70 ? "(Overbought > 70)" : (activeItem?.rsi || 50) < 30 ? "(Oversold < 30)" : "(Neutral Zone)"}
        </span>
      </div>

      <div
        style={{
          background: "var(--bg-app)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "8px 14px",
          position: "relative",
          cursor: "crosshair",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          {/* Shaded Neutral Corridor 30 to 70 */}
          <rect
            x={padLeft}
            y={getY(70)}
            width={chartW}
            height={getY(30) - getY(70)}
            fill="rgba(255, 255, 255, 0.02)"
          />

          {/* 70 Overbought Threshold */}
          <line
            x1={padLeft}
            y1={getY(70)}
            x2={width - padRight}
            y2={getY(70)}
            stroke="var(--loss)"
            strokeDasharray="4 4"
            opacity="0.8"
          />
          <text
            x={padLeft - 8}
            y={getY(70) + 4}
            textAnchor="end"
            fill="var(--loss)"
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            70
          </text>
          <text
            x={width - padRight}
            y={getY(70) - 4}
            textAnchor="end"
            fill="var(--loss)"
            fontSize="9.5"
            fontFamily="var(--font-mono)"
          >
            Overbought
          </text>

          {/* 30 Oversold Threshold */}
          <line
            x1={padLeft}
            y1={getY(30)}
            x2={width - padRight}
            y2={getY(30)}
            stroke="var(--gain)"
            strokeDasharray="4 4"
            opacity="0.8"
          />
          <text
            x={padLeft - 8}
            y={getY(30) + 4}
            textAnchor="end"
            fill="var(--gain)"
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            30
          </text>
          <text
            x={width - padRight}
            y={getY(30) + 12}
            textAnchor="end"
            fill="var(--gain)"
            fontSize="9.5"
            fontFamily="var(--font-mono)"
          >
            Oversold
          </text>

          {/* RSI Curve */}
          {rsiPath && (
            <path
              d={rsiPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
            />
          )}

          {/* Active hover crosshair */}
          {activeX != null && activeItem?.rsi != null && (
            <g>
              <line
                x1={activeX}
                y1={padTop}
                x2={activeX}
                y2={padTop + chartH}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeDasharray="2 2"
              />
              <circle
                cx={activeX}
                cy={getY(activeItem.rsi)}
                r="4.5"
                fill="#06b6d4"
                stroke="#fff"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

// Asset Table Component
function AssetTable({ rows, onSelect, showScore = false, loading = false, error = null, onRetry }) {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortKey, setSortKey] = useState(showScore ? "score" : "name");
  const [sortAsc, setSortAsc] = useState(showScore ? false : true);

  if (loading) return <TableSkeleton cols={showScore ? 9 : 8} rows={7} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!rows || !rows.length) {
    return (
      <div className="table-card" style={{ padding: "36px", textAlign: "center", color: "var(--text-muted)" }}>
        No asset data returned from market feeds.
      </div>
    );
  }

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false); // default descending for numbers
    }
  };

  const filtered = rows.filter((r) => {
    const text = `${r.name || ""} ${r.ticker || ""}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    if (!matchesQuery) return false;

    if (filterType === "bullish") return r.above_sma50;
    if (filterType === "bearish") return !r.above_sma50;
    if (filterType === "gainers") return (r.ret_1d || 0) > 0;
    if (filterType === "oversold") return r.rsi && r.rsi < 40;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortKey];
    let vb = b[sortKey];
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "string") {
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return sortAsc ? va - vb : vb - va;
  });

  return (
    <div className="animate-fade">
      <div className="filter-bar">
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div className="search-box">
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              className="search-input"
              placeholder="Filter company or ticker..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <X size={14} style={{ cursor: "pointer", color: "var(--text-muted)" }} onClick={() => setQuery("")} />
            )}
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { id: "all", label: "All" },
              { id: "gainers", label: "Today's Gainers" },
              { id: "bullish", label: "Bullish (SMA50+)" },
              { id: "oversold", label: "Oversold" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className="btn-secondary"
                style={{
                  fontSize: "12px",
                  padding: "6px 12px",
                  background: filterType === f.id ? "var(--bg-surface-hover)" : "transparent",
                  borderColor: filterType === f.id ? "var(--accent-blue)" : "var(--border-subtle)",
                  color: filterType === f.id ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Showing <b>{sorted.length}</b> of {rows.length} assets · Click row to inspect deep financials
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="stock-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort("name")}>
                  Asset / Symbol {sortKey === "name" && (sortAsc ? "▲" : "▼")}
                </th>
                <th className="sortable" onClick={() => handleSort("price")}>
                  LTP {sortKey === "price" && (sortAsc ? "▲" : "▼")}
                </th>
                <th className="sortable" onClick={() => handleSort("ret_1d")}>
                  1D % {sortKey === "ret_1d" && (sortAsc ? "▲" : "▼")}
                </th>
                <th className="sortable" onClick={() => handleSort("ret_1m")}>
                  1M % {sortKey === "ret_1m" && (sortAsc ? "▲" : "▼")}
                </th>
                <th className="sortable" onClick={() => handleSort("ret_1y")}>
                  1Y % {sortKey === "ret_1y" && (sortAsc ? "▲" : "▼")}
                </th>
                <th className="sortable" onClick={() => handleSort("volatility")}>
                  Volatility {sortKey === "volatility" && (sortAsc ? "▲" : "▼")}
                </th>
                <th className="sortable" onClick={() => handleSort("rsi")}>
                  RSI (14) {sortKey === "rsi" && (sortAsc ? "▲" : "▼")}
                </th>
                <th>Trend Alignment</th>
                {showScore && (
                  <th className="sortable" onClick={() => handleSort("score")}>
                    Alpha Score {sortKey === "score" && (sortAsc ? "▲" : "▼")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const isOverbought = r.rsi && r.rsi > 70;
                const isOversold = r.rsi && r.rsi < 30;
                const rsiClass = isOverbought ? "overbought" : isOversold ? "oversold" : "normal";
                const scoreTier = (r.score || 0) >= 70 ? "high" : (r.score || 0) >= 40 ? "med" : "low";

                const initials = (r.ticker || r.name || "ST").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();

                return (
                  <tr key={r.ticker} onClick={() => onSelect(r.ticker)}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="ticker-avatar">{initials}</div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>{r.name}</span>
                          <span className="mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {r.ticker}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="mono" style={{ fontWeight: "700" }}>
                        {r.price != null ? r.price.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "-"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-ret ${r.ret_1d > 0 ? "positive" : r.ret_1d < 0 ? "negative" : "neutral"}`}>
                        {r.ret_1d > 0 ? "▲" : r.ret_1d < 0 ? "▼" : "•"} {pct(r.ret_1d)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-ret ${r.ret_1m > 0 ? "positive" : r.ret_1m < 0 ? "negative" : "neutral"}`}>
                        {pct(r.ret_1m)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-ret ${r.ret_1y > 0 ? "positive" : r.ret_1y < 0 ? "negative" : "neutral"}`}>
                        {pct(r.ret_1y)}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ color: "var(--text-secondary)" }}>
                        {r.volatility ? `${r.volatility}%` : "-"}
                      </span>
                    </td>
                    <td>
                      <span className={`rsi-badge ${rsiClass}`}>
                        {r.rsi ?? "-"} {isOverbought ? "▲ Hot" : isOversold ? "▼ Cold" : ""}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: r.above_sma50 ? "var(--gain)" : "var(--text-muted)"
                      }}>
                        {r.above_sma50 ? "Bullish (SMA50+)" : "Bearish (Below 50)"}
                      </span>
                    </td>
                    {showScore && (
                      <td>
                        <span
                          className={`score-pill ${scoreTier}`}
                          title={r.reasons?.join("; ") || "Algorithmic screening score"}
                        >
                          {r.score}/100
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Detail Modal Dialog
function DetailModal({ ticker, onClose, onTradeStock }) {
  const { data, loading, error, refetch } = useFetch(`/analyze/${encodeURIComponent(ticker)}`);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>
                {data?.summary?.name || ticker}
              </h2>
              <span className="mono" style={{
                background: "var(--bg-surface-elevated)",
                color: "var(--text-secondary)",
                padding: "3px 8px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontWeight: "700"
              }}>
                {ticker}
              </span>
            </div>
            {data?.fundamentals?.sector && (
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Sector: <b>{data.fundamentals.sector}</b>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            {onTradeStock && (
              <button
                className="btn-secondary"
                onClick={() => {
                  onTradeStock(ticker);
                  onClose();
                }}
                style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", fontWeight: "700" }}
              >
                Trade on Paper
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <X size={16} /> Close
            </button>
          </div>
        </div>

        <div className="modal-body">
          {loading && (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <div className="skeleton" style={{ height: "80px", marginBottom: "16px" }} />
              <div className="skeleton" style={{ height: "260px" }} />
            </div>
          )}

          {error && <ErrorState message={error} onRetry={refetch} />}

          {data && (
            <>
              {/* Top Quick Metrics */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Last Traded Price</div>
                  <div className="metric-value">
                    {data.summary.price?.toLocaleString()}
                  </div>
                  <div className="metric-hint" style={{ color: data.summary.ret_1d >= 0 ? "var(--gain)" : "var(--loss)", fontWeight: "700" }}>
                    1D Change: {pct(data.summary.ret_1d)}
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Multi-Horizon Returns</div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                    <div>
                      <small style={{ color: "var(--text-muted)", display: "block" }}>1W</small>
                      <b style={{ color: data.summary.ret_1w >= 0 ? "var(--gain)" : "var(--loss)" }}>{pct(data.summary.ret_1w)}</b>
                    </div>
                    <div>
                      <small style={{ color: "var(--text-muted)", display: "block" }}>1M</small>
                      <b style={{ color: data.summary.ret_1m >= 0 ? "var(--gain)" : "var(--loss)" }}>{pct(data.summary.ret_1m)}</b>
                    </div>
                    <div>
                      <small style={{ color: "var(--text-muted)", display: "block" }}>1Y</small>
                      <b style={{ color: data.summary.ret_1y >= 0 ? "var(--gain)" : "var(--loss)" }}>{pct(data.summary.ret_1y)}</b>
                    </div>
                  </div>
                  <div className="metric-hint">Historical price momentum</div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Risk & Volatility</div>
                  <div className="metric-value" style={{ fontSize: "19px" }}>
                    Annual Vol: {data.summary.volatility}%
                  </div>
                  <div className="metric-hint" style={{ color: "var(--loss)" }}>
                    Max Drawdown: {data.summary.max_drawdown}%
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Valuation & Health</div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "4px", fontSize: "13px" }}>
                    <div>P/E: <b>{data.fundamentals?.pe ?? "-"}</b></div>
                    <div>P/B: <b>{data.fundamentals?.pb ?? "-"}</b></div>
                    <div>ROE: <b>{data.fundamentals?.roe ? `${data.fundamentals.roe}%` : "-"}</b></div>
                  </div>
                  <div className="metric-hint">Debt/Equity: {data.fundamentals?.debt_to_equity ?? "-"}</div>
                </div>
              </div>

              {/* Signals */}
              {data.summary.signals?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "12.5px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px", letterSpacing: "0.05em" }}>
                    Algorithmic Technical Indicators
                  </h4>
                  <div className="signals-container">
                    {data.summary.signals.map((sig, i) => {
                      const isBull = sig.includes("above") || sig.includes("uptrend") || sig.includes("bullish");
                      const isBear = sig.includes("below") || sig.includes("downtrend") || sig.includes("bearish") || sig.includes("overbought");
                      const sigType = isBull ? "bullish" : isBear ? "bearish" : "neutral";
                      return (
                        <div key={i} className={`signal-chip ${sigType}`}>
                          {isBull ? <TrendingUp size={13} /> : isBear ? <TrendingDown size={13} /> : <Info size={13} />}
                          {sig}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Interactive SVG Price Chart */}
              <div>
                <h4 style={{ fontSize: "12.5px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px", letterSpacing: "0.05em" }}>
                  Price Trend & 50-DMA / 200-DMA Overlay
                </h4>
                <InteractivePriceChart history={data.history} />
              </div>

              {/* Interactive SVG RSI Chart */}
              <div style={{ marginTop: "12px" }}>
                <InteractiveRsiChart history={data.history} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Group Tab (Indices, Commodities, Crypto)
function GroupTab({ group, onSelect }) {
  const { data, loading, error, refetch } = useFetch("/overview");
  const rows = data?.[group];
  return (
    <AssetTable
      rows={rows}
      onSelect={onSelect}
      loading={loading}
      error={error}
      onRetry={refetch}
    />
  );
}

// Stocks Tab (India, Global)
function StocksTab({ market, onSelect }) {
  const { data, loading, error, refetch } = useFetch(`/screener?market=${market}`);
  return (
    <div className="animate-fade">
      <div className="banner-alert info" style={{ marginBottom: "18px" }}>
        <Info size={18} />
        <div>
          <b>Algorithmic Screening Engine:</b> Alpha scores (0–100) are evaluated using multi-factor signals
          (50-DMA/200-DMA alignment, 1M/1Y momentum, RSI, P/E multiple, ROE quality, and debt levels).
          Hover or click any asset to inspect underlying factors.
        </div>
      </div>
      <AssetTable
        rows={data}
        onSelect={onSelect}
        showScore
        loading={loading}
        error={error}
        onRetry={refetch}
      />
    </div>
  );
}

// FII / DII Institutional Flows Tab
function FiiTab() {
  const { data, loading, error, refetch } = useFetch("/fii-dii");

  if (loading) return <TableSkeleton cols={5} rows={6} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const rows = data?.data || [];

  return (
    <div className="animate-fade">
      <StatusIndicator res={data} />

      <div className="banner-alert info" style={{ marginBottom: "18px" }}>
        <Landmark size={18} />
        <div>
          <b>Institutional Net Liquidity Flows:</b> Daily net buy/sell volumes by Foreign Institutional Investors
          (FII) and Domestic Mutual Funds/Institutions (DII) in <b>₹ Crore</b>. Persistent FII net outflows
          frequently apply downward pressure on benchmark indices, while aggressive DII support provides a market floor.
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Trade Date</th>
                <th>Category</th>
                <th>Buy Value (₹ Cr)</th>
                <th>Sell Value (₹ Cr)</th>
                <th>Net Inflow / Outflow (₹ Cr)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const netNum = parseFloat(r.netValue) || 0;
                const isPos = netNum >= 0;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: "700" }}>{r.date}</td>
                    <td>
                      <span className="mono" style={{
                        padding: "3px 8px",
                        borderRadius: "var(--radius-sm)",
                        background: r.category?.includes("FII") ? "rgba(59, 130, 246, 0.12)" : "rgba(139, 92, 246, 0.12)",
                        color: r.category?.includes("FII") ? "var(--accent-blue)" : "var(--accent-purple)",
                        fontWeight: "700",
                        fontSize: "12px"
                      }}>
                        {r.category}
                      </span>
                    </td>
                    <td className="mono">{r.buyValue}</td>
                    <td className="mono">{r.sellValue}</td>
                    <td>
                      <span className={`badge-ret ${isPos ? "positive" : "negative"}`}>
                        {isPos ? "▲ Net Buy" : "▼ Net Sell"} {r.netValue}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Options (F&O) Chain Matrix
function OptionsTab() {
  const [symbol, setSymbol] = useState("NIFTY");
  const [showAll, setShowAll] = useState(false);
  const { data, loading, error, refetch } = useFetch(`/options/${symbol}`, [symbol]);

  const d = data?.data;

  let atm = null;
  if (d?.spot && d.rows?.length) {
    atm = d.rows.reduce((prev, curr) =>
      Math.abs(curr.strike - d.spot) < Math.abs(prev.strike - d.spot) ? curr : prev
    ).strike;
  }

  const rows = d
    ? d.rows.filter((r) => showAll || !d.spot || Math.abs(r.strike - d.spot) / d.spot <= 0.02)
    : [];

  const maxOi = useMemo(() => {
    if (!rows.length) return 1;
    return Math.max(...rows.map((r) => Math.max(r.ce_oi || 0, r.pe_oi || 0)));
  }, [rows]);

  const pcrSentiment = d?.pcr == null ? "" : d.pcr >= 1.2 ? "Bullish (Put Heavy)" : d.pcr <= 0.8 ? "Bearish (Call Heavy)" : "Neutral Stance";

  return (
    <div className="animate-fade">
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center" }}>
        {["NIFTY", "BANKNIFTY"].map((sym) => (
          <button
            key={sym}
            onClick={() => setSymbol(sym)}
            className={`tab-btn ${symbol === sym ? "active" : ""}`}
            style={{ padding: "8px 20px" }}
          >
            {sym} Chain
          </button>
        ))}
      </div>

      <StatusIndicator res={data} />

      {error && <ErrorState message={error} onRetry={refetch} />}
      {loading && <TableSkeleton cols={5} rows={8} />}

      {d && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">{symbol} Spot Underlying</div>
              <div className="metric-value">{inr(d.spot)}</div>
              <div className="metric-hint">Expiry: {d.expiry || "Near Active Series"}</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Put / Call Ratio (PCR)</div>
              <div className="metric-value" style={{ color: d.pcr >= 1 ? "var(--gain)" : "var(--loss)" }}>
                {d.pcr ?? "-"}
              </div>
              <div className="metric-hint">{pcrSentiment}</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Max Pain Strike</div>
              <div className="metric-value" style={{ color: "var(--accent-amber)" }}>
                {d.max_pain ?? "-"}
              </div>
              <div className="metric-hint">Expiry settlement equilibrium level</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Major Call Resistance</div>
              <div className="metric-value" style={{ color: "var(--loss)" }}>
                {d.resistance ?? "-"}
              </div>
              <div className="metric-hint">Highest Open Interest Call Wall</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Major Put Support</div>
              <div className="metric-value" style={{ color: "var(--gain)" }}>
                {d.support ?? "-"}
              </div>
              <div className="metric-hint">Highest Open Interest Put Wall</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", color: "var(--text-secondary)" }}>
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                style={{ accentColor: "var(--accent-blue)", width: "16px", height: "16px" }}
              />
              Show Full Strike Chain (disable ±2% ATM filter)
            </label>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              ATM = Closest to Spot ({inr(d.spot)}) · OI in Total Contracts
            </div>
          </div>

          <div className="table-card">
            <div className="table-responsive">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th style={{ color: "var(--loss)", textAlign: "right", width: "25%" }}>CALL OI (Contracts)</th>
                    <th style={{ color: "var(--loss)", textAlign: "right" }}>CALL LTP (₹)</th>
                    <th style={{ textAlign: "center", background: "var(--bg-surface-elevated)" }}>STRIKE</th>
                    <th style={{ color: "var(--gain)", textAlign: "left" }}>PUT LTP (₹)</th>
                    <th style={{ color: "var(--gain)", textAlign: "left", width: "25%" }}>PUT OI (Contracts)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const isAtm = r.strike === atm;
                    const callPct = maxOi ? Math.min(100, Math.round((r.ce_oi / maxOi) * 100)) : 0;
                    const putPct = maxOi ? Math.min(100, Math.round((r.pe_oi / maxOi) * 100)) : 0;

                    return (
                      <tr key={r.strike} className={isAtm ? "atm-strike-row" : ""}>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                              <div className="oi-bar-fill" style={{ width: `${callPct}%` }} />
                            </div>
                            <span className="mono" style={{ color: "var(--text-secondary)", minWidth: "75px" }}>
                              {r.ce_oi?.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: "700" }}>
                          {r.ce_ltp != null ? r.ce_ltp.toFixed(2) : "-"}
                        </td>
                        <td className="strike-cell">
                          {r.strike}
                          {isAtm && (
                            <span style={{
                              marginLeft: "8px",
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "var(--accent-amber)",
                              color: "#000",
                              fontWeight: "800"
                            }}>
                              ATM
                            </span>
                          )}
                        </td>
                        <td className="mono" style={{ textAlign: "left", fontWeight: "700" }}>
                          {r.pe_ltp != null ? r.pe_ltp.toFixed(2) : "-"}
                        </td>
                        <td style={{ textAlign: "left" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "8px" }}>
                            <span className="mono" style={{ color: "var(--text-secondary)", minWidth: "75px" }}>
                              {r.pe_oi?.toLocaleString("en-IN")}
                            </span>
                            <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
                              <div className="oi-bar-fill put" style={{ width: `${putPct}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Paper Trading Terminal & Order Ticket
function PaperTab({ defaultTicker }) {
  const [version, setVersion] = useState(0);
  const { data, loading, error, refetch } = useFetch(`/paper?v=${version}`);

  const [ticker, setTicker] = useState(defaultTicker || "RELIANCE.NS");
  const [qty, setQty] = useState(10);
  const [action, setAction] = useState("BUY");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (defaultTicker) setTicker(defaultTicker);
  }, [defaultTicker]);

  const handleOrder = async () => {
    setNotice(null);
    setSubmitting(true);
    try {
      const res = await fetchFromApi("/paper/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: ticker.trim().toUpperCase(), side: action, qty: Number(qty) }),
      });
      setNotice({
        type: "success",
        text: `Executed: ${action} ${qty} shares of ${ticker} @ ${inr(res.price)}${action === "SELL" ? ` · Realized P&L: ${inr(res.realized_pnl)}` : ""}`
      });
      setVersion((v) => v + 1);
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Order execution failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickSquareOff = async (posTicker, posQty) => {
    setNotice(null);
    try {
      const res = await fetchFromApi("/paper/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: posTicker, side: "SELL", qty: posQty }),
      });
      setNotice({
        type: "success",
        text: `Squared off ${posQty} shares of ${posTicker} @ ${inr(res.price)} · Realized P&L: ${inr(res.realized_pnl)}`
      });
      setVersion((v) => v + 1);
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Failed to square off position" });
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Confirm reset: This will wipe all paper positions and restore virtual equity to ₹10,00,000.")) return;
    try {
      await fetchFromApi("/paper/reset", { method: "POST" });
      setNotice({ type: "info", text: "Paper trading portfolio has been reset to ₹10,00,000." });
      setVersion((v) => v + 1);
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Failed to reset portfolio" });
    }
  };

  if (loading && !data) return <TableSkeleton cols={6} rows={6} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="animate-fade">
      <div className="banner-alert info" style={{ marginBottom: "18px" }}>
        <Wallet size={18} />
        <div>
          <b>Simulated Brokerage Sandbox:</b> Test your technical and quantitative strategies with ₹10,00,000 in
          virtual equity. Real-time pricing calibrated from NSE live tickers.
        </div>
      </div>

      {/* Account Overview Cards */}
      {data && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Available Cash Balance</div>
            <div className="metric-value">{inr(data.cash)}</div>
            <div className="metric-hint">Liquid buying power</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Total Portfolio Net Worth</div>
            <div className="metric-value" style={{ color: "var(--accent-blue)" }}>
              {inr(data.equity)}
            </div>
            <div className="metric-hint">Cash + Holding Market Value</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Cumulative Return</div>
            <div className="metric-value" style={{ color: data.return_pct >= 0 ? "var(--gain)" : "var(--loss)" }}>
              {pct(data.return_pct)}
            </div>
            <div className="metric-hint">Initial Capital: {inr(data.start_cash)}</div>
          </div>
        </div>
      )}

      {/* Order Entry & Quick Trades */}
      <div className="paper-trade-panel">
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={18} color="var(--accent-blue)" /> Active Open Holdings ({data?.positions?.length || 0})
          </h3>

          {!data?.positions?.length ? (
            <div className="table-card" style={{ padding: "36px", textAlign: "center", color: "var(--text-muted)" }}>
              No active holdings in your ledger. Place your first simulated buy order using the ticket on the right.
            </div>
          ) : (
            <div className="table-card">
              <div className="table-responsive">
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Quantity</th>
                      <th>Avg Cost</th>
                      <th>Current LTP</th>
                      <th>Total Value</th>
                      <th>Unrealized P&L</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.positions.map((p) => {
                      const isProfit = (p.unrealized_pnl || 0) >= 0;
                      return (
                        <tr key={p.ticker}>
                          <td style={{ fontWeight: "700" }}>{p.ticker}</td>
                          <td className="mono">{p.qty}</td>
                          <td className="mono">{inr(p.avg_price)}</td>
                          <td className="mono">{inr(p.price)}</td>
                          <td className="mono">{inr(p.value)}</td>
                          <td>
                            <span className={`badge-ret ${isProfit ? "positive" : "negative"}`}>
                              {inr(p.unrealized_pnl)} ({pct(p.unrealized_pct)})
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleQuickSquareOff(p.ticker, p.qty)}
                              className="btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "11px", color: "var(--loss)", borderColor: "var(--loss-border)" }}
                            >
                              Exit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "24px 0 12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={18} color="var(--accent-purple)" /> Executed Trade Ledger
          </h3>

          {!data?.trades?.length ? (
            <div className="table-card" style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              No trades executed in this session yet.
            </div>
          ) : (
            <div className="table-card">
              <div className="table-responsive">
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Side</th>
                      <th>Symbol</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Realized P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trades.map((t, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{t.time}</td>
                        <td>
                          <span className={`badge-ret ${t.side === "BUY" ? "positive" : "negative"}`}>
                            {t.side}
                          </span>
                        </td>
                        <td style={{ fontWeight: "700" }}>{t.ticker}</td>
                        <td className="mono">{t.qty}</td>
                        <td className="mono">{inr(t.price)}</td>
                        <td className="mono" style={{ color: t.side === "SELL" ? (t.realized_pnl >= 0 ? "var(--gain)" : "var(--loss)") : "var(--text-muted)" }}>
                          {t.side === "SELL" ? inr(t.realized_pnl) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Order Placement Ticket */}
        <div>
          <div className="order-box">
            <h4 style={{ fontSize: "15px", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <Zap size={16} color="var(--accent-blue)" /> Instant Order Ticket
            </h4>

            {notice && (
              <div className={`banner-alert ${notice.type === "error" ? "error" : "info"}`} style={{ padding: "10px", margin: 0, fontSize: "12px" }}>
                {notice.text}
              </div>
            )}

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className={`tab-btn ${action === "BUY" ? "active" : ""}`}
                onClick={() => setAction("BUY")}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  background: action === "BUY" ? "var(--gain)" : "transparent",
                  color: action === "BUY" ? "#fff" : "var(--text-secondary)",
                  borderColor: action === "BUY" ? "var(--gain)" : "var(--border-subtle)",
                  fontWeight: "800"
                }}
              >
                BUY
              </button>
              <button
                className={`tab-btn ${action === "SELL" ? "active" : ""}`}
                onClick={() => setAction("SELL")}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  background: action === "SELL" ? "var(--loss)" : "transparent",
                  color: action === "SELL" ? "#fff" : "var(--text-secondary)",
                  borderColor: action === "SELL" ? "var(--loss)" : "var(--border-subtle)",
                  fontWeight: "800"
                }}
              >
                SELL
              </button>
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>
                Stock Symbol (NSE)
              </label>
              <input
                list="tickers"
                className="input-field mono"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g. RELIANCE.NS"
              />
              <datalist id="tickers">
                {PAPER_TICKERS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>
                Quantity
              </label>
              <input
                type="number"
                min="1"
                className="input-field mono"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                {[10, 25, 50, 100].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQty(n)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: "4px 0", fontSize: "11px" }}
                  >
                    +{n}
                  </button>
                ))}
              </div>
            </div>

            <button
              className={action === "BUY" ? "btn-buy" : "btn-sell"}
              onClick={handleOrder}
              disabled={submitting}
              style={{ opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Transmitting Order..." : `Transmit ${action} Order`}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
              style={{ color: "var(--loss)", borderColor: "var(--loss-border)", marginTop: "10px" }}
            >
              Reset Virtual Ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// News Feed Tab
function NewsTab() {
  const [filter, setFilter] = useState("All");
  const { data, loading, error, refetch } = useFetch("/news");

  if (loading) return <TableSkeleton cols={3} rows={8} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const sources = ["All", ...new Set((data || []).map((n) => n.source))];
  const filtered = (data || []).filter((n) => filter === "All" || n.source === filter);

  const sentimentStyles = {
    Positive: { color: "var(--gain)", bg: "var(--gain-bg)", label: "Bullish" },
    Negative: { color: "var(--loss)", bg: "var(--loss-bg)", label: "Bearish" },
    Neutral: { color: "var(--text-muted)", bg: "var(--bg-surface-elevated)", label: "Neutral" },
  };

  return (
    <div className="animate-fade">
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "18px" }}>
        {sources.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`tab-btn ${filter === s ? "active" : ""}`}
            style={{ padding: "6px 14px", fontSize: "12px" }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
        {filtered.map((item, i) => {
          const sent = sentimentStyles[item.sentiment] || sentimentStyles.Neutral;
          return (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              <div className="metric-card" style={{ height: "100%", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--accent-blue)" }}>
                      {item.source}
                    </span>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      color: sent.color,
                      background: sent.bg
                    }}>
                      {sent.label}
                    </span>
                  </div>
                  <h4 style={{ fontSize: "14px", fontWeight: "600", lineHeight: "1.4", color: "var(--text-primary)" }}>
                    {item.title}
                  </h4>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", fontSize: "11.5px", color: "var(--text-muted)" }}>
                  <span>{item.published ? item.published.slice(0, 16) : "Recent"}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--accent-blue)", fontWeight: "600" }}>
                    Read Full <ExternalLink size={11} />
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// Government & RBI Policy Tab
function PolicyTab() {
  const { data, loading, error, refetch } = useFetch("/policy");

  if (loading) return <TableSkeleton cols={4} rows={6} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const entries = data?.data || [];
  const links = data?.links || [];

  return (
    <div className="animate-fade">
      <StatusIndicator res={data} />

      <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
        <ShieldCheck size={18} color="var(--accent-blue)" /> Official Macro & Market Regulators
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {links.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="metric-card" style={{ padding: "14px 18px", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "600", fontSize: "13px" }}>{link.name}</span>
              <ExternalLink size={14} color="var(--accent-blue)" />
            </div>
          </a>
        ))}
      </div>

      <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
        <Landmark size={18} color="var(--accent-purple)" /> Curated Regulatory Decisions & Budgets
      </h3>

      {!entries.length ? (
        <div className="table-card" style={{ padding: "36px", textAlign: "center", color: "var(--text-muted)" }}>
          No policy records currently available.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {entries.map((item, idx) => (
            <div key={idx} className="metric-card" style={{ padding: "18px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                <span style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "var(--accent-purple)",
                  background: "rgba(139, 92, 246, 0.12)",
                  padding: "3px 10px",
                  borderRadius: "var(--radius-sm)"
                }}>
                  {item.category}
                </span>
                <span className="mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {item.date}
                </span>
              </div>

              <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "8px", color: "var(--text-primary)" }}>
                {item.title}
              </h4>

              {item.sectors?.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Impacted Sectors:</span>
                  {item.sectors.map((sec, sIdx) => (
                    <span key={sIdx} style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      background: "var(--bg-surface-elevated)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-subtle)"
                    }}>
                      {sec}
                    </span>
                  ))}
                </div>
              )}

              {item.source && (
                <div style={{ marginTop: "10px" }}>
                  <a
                    href={item.source}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "12px", color: "var(--accent-blue)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    Official Document Source <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Academy & Glossary Tab
const LEARN_MODULES = [
  {
    step: "01",
    title: "Fundamental Analysis Framework",
    body: "Analyze enterprise fundamentals: Revenue trajectory, operating margins, P/E ratio, Return on Equity (ROE > 15%), and Debt-to-Equity (< 1.0). Inspect P/E, ROE, and leverage metrics before deploying capital."
  },
  {
    step: "02",
    title: "Technical Trend Confirmation",
    body: "Moving averages show systematic directional bias. When price trades above both the 50-day and 200-day Simple Moving Average, and the 50-DMA trades above the 200-DMA, the asset exhibits long-term structural uptrend."
  },
  {
    step: "03",
    title: "Momentum & Mean Reversion",
    body: "The Relative Strength Index (RSI 14) measures price velocity. Readings above 70 indicate overheated momentum prone to consolidation; readings below 30 indicate deep oversold conditions ripe for short-term mean reversion."
  },
  {
    step: "04",
    title: "Institutional Flow Tracking",
    body: "Foreign Institutional Investors (FII) and Domestic Mutual Funds (DII) direct Dalal Street's liquidity. Sustained FII selling pressures benchmark indices; strong DII SIP flows provide an institutional floor."
  },
  {
    step: "05",
    title: "Derivatives Risk Architecture",
    body: "Options provide leverage and hedging capabilities. Over 90% of retail option buyers sustain capital attrition due to theta decay. Study Open Interest (OI) buildup, Put-Call Ratio (PCR), and Max Pain before trading."
  },
  {
    step: "06",
    title: "Paper Trading Discipline",
    body: "Refine order execution and risk sizing in our Virtual Sandbox. Log your thesis, stop loss, and target price for every trade to achieve consistency before risking real funds."
  }
];

const GLOSSARY_ITEMS = [
  { term: "Open Interest (OI)", desc: "The total number of outstanding derivative contracts that haven't been settled. Rising OI alongside rising price confirms aggressive bullish trend continuation." },
  { term: "Put-Call Ratio (PCR)", desc: "Calculated as total Put Open Interest divided by total Call Open Interest. Readings > 1.2 suggest strong bullish support; readings < 0.8 reflect heavy call writing and resistance." },
  { term: "Max Pain Strike", desc: "The strike price where option buyers would lose the maximum cumulative premium upon expiry. Strike prices often experience gravitational pull toward Max Pain on expiry days." },
  { term: "Resistance & Support Walls", desc: "The strike with the highest Call OI constitutes primary overhead Resistance; the strike with the highest Put OI represents primary floor Support." },
  { term: "At-The-Money (ATM)", desc: "The strike price nearest to the current underlying market price. ATM options possess the highest liquidity and trading volume." },
  { term: "Implied Volatility (IV)", desc: "The market's forecast of the likely movement in an underlying asset's price. Spikes during major macro announcements, RBI meetings, or earnings releases." },
  { term: "50-DMA & 200-DMA", desc: "The 50-day and 200-day Simple Moving Averages. A 'Golden Cross' occurs when the 50-DMA crosses above the 200-DMA, signaling long-term bullish structural expansion." }
];

function LearnTab() {
  const [search, setSearch] = useState("");

  const filteredGlossary = GLOSSARY_ITEMS.filter((g) =>
    g.term.toLowerCase().includes(search.toLowerCase()) ||
    g.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade">
      <div className="banner-alert info" style={{ marginBottom: "24px" }}>
        <BookOpen size={18} />
        <div>
          <b>Vortex Financial Academy:</b> A structured curriculum designed to build technical intuition,
          institutional order flow awareness, and systematic risk management principles.
        </div>
      </div>

      <h3 style={{ fontSize: "17px", fontWeight: "800", marginBottom: "16px" }}>
        Structured Strategy Roadmap
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {LEARN_MODULES.map((m) => (
          <div key={m.step} className="metric-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span className="mono" style={{
                fontSize: "12px",
                fontWeight: "800",
                background: "rgba(59, 130, 246, 0.15)",
                color: "var(--accent-blue)",
                padding: "3px 8px",
                borderRadius: "var(--radius-sm)"
              }}>
                STEP {m.step}
              </span>
            </div>
            <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "8px", color: "var(--text-primary)" }}>
              {m.title}
            </h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
              {m.body}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "gap", gap: "12px", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "17px", fontWeight: "800", margin: 0 }}>
          Interactive Derivatives & Market Glossary
        </h3>
        <div className="search-box" style={{ minWidth: "260px" }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            className="search-input"
            placeholder="Search glossary definitions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="stock-table">
            <thead>
              <tr>
                <th style={{ width: "260px" }}>Financial Term</th>
                <th>Institutional Definition & Trading Application</th>
              </tr>
            </thead>
            <tbody>
              {filteredGlossary.map((g) => (
                <tr key={g.term}>
                  <td style={{ fontWeight: "700", color: "var(--accent-blue)" }}>{g.term}</td>
                  <td style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    {g.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Main App Container
export default function App() {
  const [activeTab, setActiveTab] = useState("Indices");
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [paperStock, setPaperStock] = useState("RELIANCE.NS");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("vortex_theme") || "dark";
  });
  const [refreshSeed, setRefreshSeed] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("vortex_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  const handleRefresh = () => {
    setRefreshSeed((s) => s + 1);
  };

  const handleTradeStock = (ticker) => {
    setPaperStock(ticker);
    setActiveTab("Paper Trade");
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "Indices":
        return <GroupTab key={refreshSeed} group="indices" onSelect={setSelectedTicker} />;
      case "Indian Stocks":
        return <StocksTab key={refreshSeed} market="india" onSelect={setSelectedTicker} />;
      case "Global Stocks":
        return <StocksTab key={refreshSeed} market="global" onSelect={setSelectedTicker} />;
      case "Commodities":
        return <GroupTab key={refreshSeed} group="commodities" onSelect={setSelectedTicker} />;
      case "Crypto":
        return <GroupTab key={refreshSeed} group="crypto" onSelect={setSelectedTicker} />;
      case "FII / DII":
        return <FiiTab key={refreshSeed} />;
      case "Options (F&O)":
        return <OptionsTab key={refreshSeed} />;
      case "Paper Trade":
        return <PaperTab key={refreshSeed} defaultTicker={paperStock} />;
      case "News":
        return <NewsTab key={refreshSeed} />;
      case "Policy":
        return <PolicyTab key={refreshSeed} />;
      case "Learn":
        return <LearnTab />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Real-time Top Marquee Ribbon */}
      <LiveTickerTape onSelect={setSelectedTicker} />

      {/* Institutional Terminal Header */}
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onRefresh={handleRefresh}
        onSelectTicker={setSelectedTicker}
      />

      {/* Segmented Navigation Tabs */}
      <nav className="tabs-nav">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedTicker(null);
              }}
              className={`tab-btn ${isActive ? "active" : ""}`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="app-main">
        {/* Top Market Overview Cards */}
        <OverviewCardsRow onSelect={setSelectedTicker} />

        {/* Detail Modal / Drawer */}
        {selectedTicker && (
          <DetailModal
            ticker={selectedTicker}
            onClose={() => setSelectedTicker(null)}
            onTradeStock={handleTradeStock}
          />
        )}

        {renderActiveTab()}
      </main>
    </div>
  );
}