import re
from typing import List, Dict, Any, Optional
import yfinance as yf

# Comprehensive, instant pre-indexed catalog
CATALOG: List[Dict[str, Any]] = [
    # ==================== CRYPTOCURRENCIES ====================
    {"symbol": "BTC-USD", "name": "Bitcoin", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["btc", "crypto", "satoshi"]},
    {"symbol": "ETH-USD", "name": "Ethereum", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["eth", "ether", "vitalik"]},
    {"symbol": "SOL-USD", "name": "Solana", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["sol"]},
    {"symbol": "BNB-USD", "name": "BNB (Binance Coin)", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["bnb", "binance"]},
    {"symbol": "XRP-USD", "name": "XRP (Ripple)", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["xrp", "ripple"]},
    {"symbol": "DOGE-USD", "name": "Dogecoin", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["doge", "meme"]},
    {"symbol": "ADA-USD", "name": "Cardano", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["ada", "cardano"]},
    {"symbol": "AVAX-USD", "name": "Avalanche", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["avax"]},
    {"symbol": "SHIB-USD", "name": "Shiba Inu", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["shib", "meme"]},
    {"symbol": "SUI-USD", "name": "Sui", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["sui", "layer1"]},
    {"symbol": "PEPE-USD", "name": "Pepe", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["pepe", "meme"]},
    {"symbol": "LINK-USD", "name": "Chainlink", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["link", "oracle"]},
    {"symbol": "DOT-USD", "name": "Polkadot", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["dot"]},
    {"symbol": "NEAR-USD", "name": "NEAR Protocol", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["near", "ai"]},
    {"symbol": "APT-USD", "name": "Aptos", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["apt"]},
    {"symbol": "LTC-USD", "name": "Litecoin", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["ltc"]},
    {"symbol": "TON-USD", "name": "Toncoin", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["ton", "telegram"]},
    {"symbol": "BCH-USD", "name": "Bitcoin Cash", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["bch"]},
    {"symbol": "UNI-USD", "name": "Uniswap", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["uni", "dex", "defi"]},
    {"symbol": "XLM-USD", "name": "Stellar Lumens", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["xlm", "stellar"]},
    {"symbol": "XMR-USD", "name": "Monero", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["xmr", "privacy"]},
    {"symbol": "ATOM-USD", "name": "Cosmos", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["atom"]},
    {"symbol": "TIA-USD", "name": "Celestia", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["tia", "modular"]},
    {"symbol": "INJ-USD", "name": "Injective", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["inj", "defi"]},
    {"symbol": "TAO-USD", "name": "Bittensor", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["tao", "ai"]},
    {"symbol": "FET-USD", "name": "Artificial Superintelligence Alliance", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["fet", "fetch", "asi", "ai"]},
    {"symbol": "RENDER-USD", "name": "Render", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["rndr", "render", "ai", "gpu"]},
    {"symbol": "KAS-USD", "name": "Kaspa", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["kas", "pow"]},
    {"symbol": "POL-USD", "name": "Polygon (POL)", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["matic", "pol", "polygon"]},
    {"symbol": "FLOKI-USD", "name": "Floki", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["floki", "meme"]},
    {"symbol": "BONK-USD", "name": "Bonk", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["bonk", "meme"]},
    {"symbol": "WIF-USD", "name": "dogwifhat", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["wif", "meme"]},
    {"symbol": "ARB-USD", "name": "Arbitrum", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["arb", "layer2"]},
    {"symbol": "OP-USD", "name": "Optimism", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["op", "layer2"]},
    {"symbol": "HBAR-USD", "name": "Hedera Hashgraph", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["hbar"]},
    {"symbol": "ICP-USD", "name": "Internet Computer", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["icp"]},
    {"symbol": "VET-USD", "name": "VeChain", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["vet"]},
    {"symbol": "FIL-USD", "name": "Filecoin", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["fil", "storage"]},
    {"symbol": "AAVE-USD", "name": "Aave", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["aave", "defi", "lending"]},
    {"symbol": "MKR-USD", "name": "Maker", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["mkr", "dai", "defi"]},
    {"symbol": "STX-USD", "name": "Stacks", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["stx", "bitcoin layer2"]},
    {"symbol": "SAND-USD", "name": "The Sandbox", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["sand", "metaverse"]},
    {"symbol": "MANA-USD", "name": "Decentraland", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["mana", "metaverse"]},
    {"symbol": "SEI-USD", "name": "Sei Network", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["sei"]},
    {"symbol": "JUP-USD", "name": "Jupiter", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["jup", "solana dex"]},
    {"symbol": "ONDO-USD", "name": "Ondo Finance", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["ondo", "rwa"]},
    {"symbol": "PENDLE-USD", "name": "Pendle", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["pendle", "yield"]},
    {"symbol": "WLD-USD", "name": "Worldcoin", "type": "crypto", "exchange": "Crypto", "currency": "$", "keywords": ["wld", "sam altman"]},

    # ==================== INDIAN STOCKS (NSE/BSE) ====================
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["ril", "mukesh ambani", "jio"]},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services (TCS)", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["tcs", "tata", "it"]},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["hdfc", "bank"]},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["icici", "bank"]},
    {"symbol": "INFY.NS", "name": "Infosys Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["infy", "infosys", "it"]},
    {"symbol": "SBIN.NS", "name": "State Bank of India (SBI)", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["sbi", "psu bank"]},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["airtel", "telecom"]},
    {"symbol": "ITC.NS", "name": "ITC Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["itc", "fmcg", "cigarette", "hotels"]},
    {"symbol": "LT.NS", "name": "Larsen & Toubro (L&T)", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["l&t", "infra", "engineering"]},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["kotak", "bank"]},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["tatamotors", "tata", "ev", "jlr"]},
    {"symbol": "AXISBANK.NS", "name": "Axis Bank Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["axis", "bank"]},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical Industries", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["sun", "pharma"]},
    {"symbol": "TITAN.NS", "name": "Titan Company Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["titan", "tanishq", "jewellery", "tata"]},
    {"symbol": "MARUTI.NS", "name": "Maruti Suzuki India Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["maruti", "suzuki", "auto"]},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["bajaj", "nbfc"]},
    {"symbol": "ADANIENT.NS", "name": "Adani Enterprises Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["adani", "gautam adani"]},
    {"symbol": "ADANIPORTS.NS", "name": "Adani Ports and SEZ", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["adani ports", "ports"]},
    {"symbol": "NTPC.NS", "name": "NTPC Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["ntpc", "power"]},
    {"symbol": "ONGC.NS", "name": "Oil & Natural Gas Corporation (ONGC)", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["ongc", "oil", "gas"]},
    {"symbol": "TATASTEEL.NS", "name": "Tata Steel Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["tatasteel", "steel", "tata"]},
    {"symbol": "POWERGRID.NS", "name": "Power Grid Corporation of India", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["powergrid", "transmission"]},
    {"symbol": "ULTRACEMCO.NS", "name": "UltraTech Cement Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["ultratech", "cement", "aditya birla"]},
    {"symbol": "COALINDIA.NS", "name": "Coal India Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["coal", "mining"]},
    {"symbol": "ZOMATO.NS", "name": "Zomato Limited (Eternal)", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["zomato", "blinkit", "food delivery", "quick commerce"]},
    {"symbol": "BAJAJFINSV.NS", "name": "Bajaj Finserv Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["finserv", "bajaj"]},
    {"symbol": "HINDALCO.NS", "name": "Hindalco Industries Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["hindalco", "aluminium", "metals"]},
    {"symbol": "GRASIM.NS", "name": "Grasim Industries Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["grasim", "paints", "birla"]},
    {"symbol": "TECHM.NS", "name": "Tech Mahindra Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["techm", "mahindra", "it"]},
    {"symbol": "WIPRO.NS", "name": "Wipro Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["wipro", "it"]},
    {"symbol": "JSWSTEEL.NS", "name": "JSW Steel Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["jsw", "steel"]},
    {"symbol": "M&M.NS", "name": "Mahindra & Mahindra Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["m&m", "mahindra", "suv", "tractor"]},
    {"symbol": "ASIANPAINT.NS", "name": "Asian Paints Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["asian paints", "paints"]},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["hul", "unilever", "fmcg"]},
    {"symbol": "CIPLA.NS", "name": "Cipla Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["cipla", "pharma"]},
    {"symbol": "BPCL.NS", "name": "Bharat Petroleum Corp Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["bpcl", "petrol"]},
    {"symbol": "IOC.NS", "name": "Indian Oil Corporation", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["ioc", "oil"]},
    {"symbol": "DRREDDY.NS", "name": "Dr. Reddy's Laboratories", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["dr reddy", "pharma"]},
    {"symbol": "APOLLOHOSP.NS", "name": "Apollo Hospitals Enterprise", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["apollo", "hospital", "healthcare"]},
    {"symbol": "EICHERMOT.NS", "name": "Eicher Motors Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["eicher", "royal enfield", "bike"]},
    {"symbol": "DIVISLAB.NS", "name": "Divi's Laboratories", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["divis", "pharma"]},
    {"symbol": "HEROMOTOCO.NS", "name": "Hero MotoCorp Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["hero", "two wheeler"]},
    {"symbol": "BRITANNIA.NS", "name": "Britannia Industries Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["britannia", "biscuits", "fmcg"]},
    {"symbol": "INDUSINDBK.NS", "name": "IndusInd Bank Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["indusind", "bank"]},
    {"symbol": "TATAPOWER.NS", "name": "Tata Power Company Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["tatapower", "solar", "ev charging"]},
    {"symbol": "TRENT.NS", "name": "Trent Limited (Westside, Zudio)", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["trent", "zudio", "westside", "retail", "tata"]},
    {"symbol": "BEL.NS", "name": "Bharat Electronics Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["bel", "defence"]},
    {"symbol": "HAL.NS", "name": "Hindustan Aeronautics Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["hal", "defence", "tejas"]},
    {"symbol": "JIOFIN.NS", "name": "Jio Financial Services", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["jiofin", "jio financial", "ambani"]},
    {"symbol": "DLF.NS", "name": "DLF Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["dlf", "real estate"]},
    {"symbol": "VEDL.NS", "name": "Vedanta Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["vedanta", "mining", "metals"]},
    {"symbol": "SIEMENS.NS", "name": "Siemens India", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["siemens", "engineering"]},
    {"symbol": "VBL.NS", "name": "Varun Beverages (PepsiCo)", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["vbl", "varun beverages", "pepsi"]},
    {"symbol": "REC.NS", "name": "REC Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["rec", "power finance"]},
    {"symbol": "PFC.NS", "name": "Power Finance Corporation", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["pfc"]},
    {"symbol": "MAZDOCK.NS", "name": "Mazagon Dock Shipbuilders", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["mazagon", "defence", "ship"]},
    {"symbol": "COCHINSHIP.NS", "name": "Cochin Shipyard Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["cochin shipyard", "defence"]},
    {"symbol": "IRFC.NS", "name": "Indian Railway Finance Corp", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["irfc", "railway"]},
    {"symbol": "RVNL.NS", "name": "Rail Vikas Nigam Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["rvnl", "railway"]},
    {"symbol": "SUZLON.NS", "name": "Suzlon Energy Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["suzlon", "wind", "green energy"]},
    {"symbol": "PAYTM.NS", "name": "One97 Communications (Paytm)", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["paytm", "fintech"]},
    {"symbol": "CDSL.NS", "name": "Central Depository Services (CDSL)", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["cdsl", "depository"]},
    {"symbol": "BSE.NS", "name": "BSE Limited", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["bse", "exchange"]},
    {"symbol": "MCX.NS", "name": "Multi Commodity Exchange (MCX)", "type": "stock", "exchange": "NSE", "currency": "₹", "keywords": ["mcx", "commodity exchange"]},

    # ==================== US & GLOBAL EQUITIES ====================
    {"symbol": "AAPL", "name": "Apple Inc.", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["apple", "iphone", "mac", "tech"]},
    {"symbol": "MSFT", "name": "Microsoft Corporation", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["microsoft", "windows", "azure", "ai"]},
    {"symbol": "NVDA", "name": "NVIDIA Corporation", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["nvidia", "gpu", "ai", "chips"]},
    {"symbol": "GOOGL", "name": "Alphabet Inc. (Google)", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["google", "alphabet", "youtube", "search"]},
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["amazon", "aws", "ecommerce"]},
    {"symbol": "META", "name": "Meta Platforms (Facebook)", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["meta", "facebook", "instagram", "whatsapp"]},
    {"symbol": "TSLA", "name": "Tesla Inc.", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["tesla", "elon musk", "ev", "robotics"]},
    {"symbol": "BRK-B", "name": "Berkshire Hathaway Inc.", "type": "stock", "exchange": "NYSE", "currency": "$", "keywords": ["berkshire", "warren buffett"]},
    {"symbol": "TSM", "name": "Taiwan Semiconductor (TSMC)", "type": "stock", "exchange": "NYSE", "currency": "$", "keywords": ["tsmc", "semiconductors", "chips"]},
    {"symbol": "AVGO", "name": "Broadcom Inc.", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["broadcom", "chips", "networking"]},
    {"symbol": "LLY", "name": "Eli Lilly and Company", "type": "stock", "exchange": "NYSE", "currency": "$", "keywords": ["eli lilly", "glp1", "weight loss", "pharma"]},
    {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "type": "stock", "exchange": "NYSE", "currency": "$", "keywords": ["jpmorgan", "chase", "bank"]},
    {"symbol": "WMT", "name": "Walmart Inc.", "type": "stock", "exchange": "NYSE", "currency": "$", "keywords": ["walmart", "retail"]},
    {"symbol": "V", "name": "Visa Inc.", "type": "stock", "exchange": "NYSE", "currency": "$", "keywords": ["visa", "payments"]},
    {"symbol": "MA", "name": "Mastercard Incorporated", "type": "stock", "exchange": "NYSE", "currency": "$", "keywords": ["mastercard", "payments"]},
    {"symbol": "XOM", "name": "Exxon Mobil Corporation", "type": "stock", "exchange": "NYSE", "currency": "$", "keywords": ["exxon", "oil", "energy"]},
    {"symbol": "AMD", "name": "Advanced Micro Devices (AMD)", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["amd", "cpu", "gpu", "ai"]},
    {"symbol": "NFLX", "name": "Netflix Inc.", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["netflix", "streaming", "movies"]},
    {"symbol": "COST", "name": "Costco Wholesale Corporation", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["costco", "wholesale"]},
    {"symbol": "PLTR", "name": "Palantir Technologies Inc.", "type": "stock", "exchange": "NYSE", "currency": "$", "keywords": ["palantir", "ai", "defense", "data"]},
    {"symbol": "COIN", "name": "Coinbase Global Inc.", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["coinbase", "crypto exchange", "bitcoin"]},
    {"symbol": "ASML", "name": "ASML Holding N.V.", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["asml", "lithography", "semiconductor"]},
    {"symbol": "ORCL", "name": "Oracle Corporation", "type": "stock", "exchange": "NYSE", "currency": "$", "keywords": ["oracle", "database", "cloud"]},
    {"symbol": "CRM", "name": "Salesforce Inc.", "type": "stock", "exchange": "NYSE", "currency": "$", "keywords": ["salesforce", "crm", "cloud"]},
    {"symbol": "INTC", "name": "Intel Corporation", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["intel", "chips", "cpu"]},
    {"symbol": "QCOM", "name": "QUALCOMM Incorporated", "type": "stock", "exchange": "NASDAQ", "currency": "$", "keywords": ["qualcomm", "snapdragon", "5g"]},
    {"symbol": "BABA", "name": "Alibaba Group Holding", "type": "stock", "exchange": "NYSE", "currency": "$", "keywords": ["alibaba", "china", "ecommerce"]},
    {"symbol": "SONY", "name": "Sony Group Corporation", "type": "stock", "exchange": "NYSE", "currency": "$", "keywords": ["sony", "playstation", "gaming"]},
    {"symbol": "7203.T", "name": "Toyota Motor Corp (Japan)", "type": "stock", "exchange": "Tokyo", "currency": "¥", "keywords": ["toyota", "auto"]},
    {"symbol": "0700.HK", "name": "Tencent Holdings (Hong Kong)", "type": "stock", "exchange": "HKEX", "currency": "HK$", "keywords": ["tencent", "wechat", "gaming"]},
    {"symbol": "SAP.DE", "name": "SAP SE (Germany)", "type": "stock", "exchange": "XETRA", "currency": "€", "keywords": ["sap", "software", "enterprise"]},

    # ==================== BENCHMARKS & COMMODITIES ====================
    {"symbol": "^NSEI", "name": "NIFTY 50", "type": "index", "exchange": "NSE", "currency": "₹", "keywords": ["nifty", "index", "indian market"]},
    {"symbol": "^BSESN", "name": "SENSEX", "type": "index", "exchange": "BSE", "currency": "₹", "keywords": ["sensex", "bse", "index"]},
    {"symbol": "^NSEBANK", "name": "BANK NIFTY", "type": "index", "exchange": "NSE", "currency": "₹", "keywords": ["banknifty", "banking index"]},
    {"symbol": "^GSPC", "name": "S&P 500", "type": "index", "exchange": "US", "currency": "$", "keywords": ["sp500", "wall street"]},
    {"symbol": "^IXIC", "name": "NASDAQ Composite", "type": "index", "exchange": "US", "currency": "$", "keywords": ["nasdaq", "tech index"]},
    {"symbol": "GC=F", "name": "Gold Futures", "type": "commodity", "exchange": "COMEX", "currency": "$", "keywords": ["gold", "bullion", "sona"]},
    {"symbol": "SI=F", "name": "Silver Futures", "type": "commodity", "exchange": "COMEX", "currency": "$", "keywords": ["silver", "chandi"]},
    {"symbol": "CL=F", "name": "Crude Oil (WTI)", "type": "commodity", "exchange": "NYMEX", "currency": "$", "keywords": ["crude", "oil", "petroleum"]},
    {"symbol": "INR=X", "name": "USD / INR Forex", "type": "forex", "exchange": "FX", "currency": "₹", "keywords": ["usdinr", "rupee", "forex"]},
]


# Symbol aliases map for instant resolution (e.g. BTC -> BTC-USD, RELIANCE -> RELIANCE.NS)
SYMBOL_ALIASES = {
    # Cryptos
    "BTC": "BTC-USD", "BITCOIN": "BTC-USD",
    "ETH": "ETH-USD", "ETHEREUM": "ETH-USD",
    "SOL": "SOL-USD", "SOLANA": "SOL-USD",
    "BNB": "BNB-USD",
    "XRP": "XRP-USD", "RIPPLE": "XRP-USD",
    "DOGE": "DOGE-USD", "DOGECOIN": "DOGE-USD",
    "ADA": "ADA-USD", "CARDANO": "ADA-USD",
    "AVAX": "AVAX-USD", "AVALANCHE": "AVAX-USD",
    "SHIB": "SHIB-USD", "SHIBA": "SHIB-USD",
    "SUI": "SUI-USD",
    "PEPE": "PEPE-USD",
    "LINK": "LINK-USD", "CHAINLINK": "LINK-USD",
    "DOT": "DOT-USD", "POLKADOT": "DOT-USD",
    "NEAR": "NEAR-USD",
    "APT": "APT-USD", "APTOS": "APT-USD",
    "LTC": "LTC-USD", "LITECOIN": "LTC-USD",
    "TON": "TON-USD",
    "UNI": "UNI-USD", "UNISWAP": "UNI-USD",
    "XLM": "XLM-USD", "STELLAR": "XLM-USD",
    "XMR": "XMR-USD", "MONERO": "XMR-USD",
    "MATIC": "POL-USD", "POL": "POL-USD",
    "TIA": "TIA-USD", "TAO": "TAO-USD", "FET": "FET-USD",
    "RENDER": "RENDER-USD", "RNDR": "RENDER-USD",

    # Indian Stocks
    "RELIANCE": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "HDFCBANK": "HDFCBANK.NS", "HDFC": "HDFCBANK.NS",
    "ICICIBANK": "ICICIBANK.NS", "ICICI": "ICICIBANK.NS",
    "INFY": "INFY.NS", "INFOSYS": "INFY.NS",
    "SBIN": "SBIN.NS", "SBI": "SBIN.NS",
    "TATAMOTORS": "TATAMOTORS.NS",
    "TATASTEEL": "TATASTEEL.NS",
    "TATAPOWER": "TATAPOWER.NS",
    "ZOMATO": "ZOMATO.NS",
    "BHARTIARTL": "BHARTIARTL.NS", "AIRTEL": "BHARTIARTL.NS",
    "ITC": "ITC.NS",
    "LT": "LT.NS",
    "KOTAKBANK": "KOTAKBANK.NS", "KOTAK": "KOTAKBANK.NS",
    "MARUTI": "MARUTI.NS",
    "TITAN": "TITAN.NS",
    "ADANIENT": "ADANIENT.NS",
    "HAL": "HAL.NS", "BEL": "BEL.NS",
    "TRENT": "TRENT.NS",
    "SUZLON": "SUZLON.NS",
}


def normalize_ticker(raw_query: str) -> str:
    """Normalize user input to proper Yahoo Finance ticker symbol."""
    q = raw_query.strip().upper()
    if q in SYMBOL_ALIASES:
        return SYMBOL_ALIASES[q]
    return q


def search_assets(query: str, category: str = "all", limit: int = 12) -> List[Dict[str, Any]]:
    """
    Search across all crypto and stocks.
    Fast instant in-memory matching with dynamic Yahoo Finance search fallback.
    """
    if not query or len(query.strip()) < 1:
        # Return popular featured assets
        featured = [c for c in CATALOG if c["symbol"] in [
            "BTC-USD", "ETH-USD", "SOL-USD", "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS",
            "TATAMOTORS.NS", "NVDA", "AAPL", "TSLA", "^NSEI", "GC=F"
        ]]
        if category != "all":
            featured = [c for c in featured if c["type"] == category]
        return featured[:limit]

    q_clean = query.strip().lower()
    q_upper = query.strip().upper()
    category = category.lower()

    scored_results = []
    seen_symbols = set()

    for item in CATALOG:
        # Filter by category if requested
        if category != "all" and item["type"] != category:
            continue

        sym = item["symbol"].lower()
        clean_sym = sym.replace("-usd", "").replace(".ns", "").replace(".bo", "").replace("^", "")
        name = item["name"].lower()
        keywords = [k.lower() for k in item.get("keywords", [])]

        score = 0
        # Exact symbol match (highest priority)
        if q_upper == item["symbol"] or q_clean == clean_sym:
            score += 100
        # Exact name match or primary asset name start
        elif q_clean == name or name.startswith(q_clean + " "):
            score += 90
        # Prefix symbol match
        elif clean_sym.startswith(q_clean) or sym.startswith(q_clean):
            score += 75
        # Name starts with query
        elif name.startswith(q_clean):
            score += 65
        # Name contains query as a distinct word
        elif re.search(r'\b' + re.escape(q_clean), name):
            score += 50
        # Exact keyword match
        elif q_clean in keywords:
            score += 40
        # Substring in name or symbol
        elif q_clean in name or q_clean in sym:
            score += 25
        # Any keyword starts with query
        elif any(k.startswith(q_clean) for k in keywords):
            score += 20

        if score > 0:
            scored_results.append((score, item))
            seen_symbols.add(item["symbol"])

    # Sort descending by match score
    scored_results.sort(key=lambda x: x[0], reverse=True)
    results = [item for _, item in scored_results]

    # If few results or user typed a specific ticker not in catalog, search Yahoo Finance live
    if len(results) < 4:
        try:
            yf_search = yf.Search(query.strip(), max_results=8)
            for quote in getattr(yf_search, "quotes", []) or []:
                symbol = quote.get("symbol")
                if not symbol or symbol in seen_symbols:
                    continue

                q_type = quote.get("quoteType", "").upper()
                exch = quote.get("exchDisp", quote.get("exchange", "Global"))

                # Categorize
                if q_type == "CRYPTOCURRENCY" or symbol.endswith("-USD"):
                    asset_type = "crypto"
                    currency = "$"
                elif q_type in ["EQUITY", "ETF"]:
                    asset_type = "stock"
                    currency = "₹" if symbol.endswith(".NS") or symbol.endswith(".BO") else "$"
                elif q_type == "INDEX":
                    asset_type = "index"
                    currency = "₹" if symbol.startswith("^NSE") or symbol.startswith("^BSE") else "$"
                else:
                    asset_type = "stock"
                    currency = "$"

                if category != "all" and asset_type != category:
                    continue

                seen_symbols.add(symbol)
                results.append({
                    "symbol": symbol,
                    "name": quote.get("longname") or quote.get("shortname") or symbol,
                    "type": asset_type,
                    "exchange": exch,
                    "currency": currency,
                    "sector": quote.get("sector"),
                    "industry": quote.get("industry"),
                })
                if len(results) >= limit:
                    break
        except Exception:
            pass

    return results[:limit]
