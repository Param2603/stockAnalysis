import json
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")
DATA = Path(__file__).parent / "data"
CACHE_DIR = DATA / "cache"
MANUAL_DIR = DATA / "manual"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
MANUAL_DIR.mkdir(parents=True, exist_ok=True)


def _now():
    return datetime.now(IST)


def _pack(status, data, updated_at, source_url, instructions, error=None):
    return {
        "status": status,  # live | cached | stale | manual | manual_update_needed
        "data": data,
        "updated_at": updated_at,
        "source_url": source_url,
        "instructions": instructions,
        "error": error,
    }


def load_json_list(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) and data else None


def resolve(name, source_url, instructions, max_age_hours=24,
            fetch=None, manual_loader=None, manual_path=None):
    """
    Order of attempts:
      1. Live fetch. Success -> status 'live' and the result is saved.
      2. Manual file the user filled in -> status 'manual'.
      3. Last saved copy -> 'cached' if recent, 'stale' if old.
      4. Nothing at all -> 'manual_update_needed'.
    """
    cache_path = CACHE_DIR / f"{name}.json"
    error = None

    if fetch:
        try:
            data = fetch()
            now = _now().isoformat()
            cache_path.write_text(json.dumps({"data": data, "updated_at": now}), encoding="utf-8")
            return _pack("live", data, now, source_url, instructions)
        except Exception as e:
            error = f"{type(e).__name__}: {e}"[:200]

    if manual_loader and manual_path and manual_path.exists():
        try:
            data = manual_loader(manual_path)
            if data:
                ts = datetime.fromtimestamp(manual_path.stat().st_mtime, IST).isoformat()
                return _pack("manual", data, ts, source_url, instructions, error)
        except Exception as e:
            error = f"{error or 'manual file problem'} | manual file unreadable: {e}"

    if cache_path.exists():
        cached = json.loads(cache_path.read_text(encoding="utf-8"))
        updated = cached["updated_at"]
        age = _now() - datetime.fromisoformat(updated)
        status = "cached" if age <= timedelta(hours=max_age_hours) else "stale"
        return _pack(status, cached["data"], updated, source_url, instructions, error)

    return _pack("manual_update_needed", None, None, source_url, instructions,
                 error or "No data source available")