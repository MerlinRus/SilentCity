import argparse
import json
import math
import os
import tempfile
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def normalize(data):
    current = data["current"]
    daily = data["daily"]
    if data.get("timezone") != "Europe/Moscow":
        raise ValueError("Unexpected weather timezone")
    fields = {"temperature": "temperature_2m", "code": "weather_code", "cloud": "cloud_cover", "wind": "wind_speed_10m", "precipitation": "precipitation"}
    result = {key: current[source] for key, source in fields.items()}
    limits = {"temperature": (-80, 60), "code": (0, 99), "cloud": (0, 100), "wind": (0, 250), "precipitation": (0, 300)}
    for key, (minimum, maximum) in limits.items():
        number = result[key]
        if isinstance(number, bool) or not isinstance(number, (float, int)) or not math.isfinite(number) or not minimum <= number <= maximum:
            raise ValueError(f"Invalid weather field: {key}")
    if not isinstance(result["code"], int) or result["code"] not in (0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 97, 99):
        raise ValueError("Unsupported weather code")
    observed = current["time"]
    now = int(time.time())
    if not isinstance(observed, int) or not now - 5400 <= observed <= now + 900:
        raise ValueError("Weather data is not current")
    local_zone = timezone(timedelta(seconds=data["utc_offset_seconds"]))
    days = []
    if not 1 <= len(daily["time"]) <= 3 or len(daily["time"]) != len(daily["sunrise"]) or len(daily["time"]) != len(daily["sunset"]):
        raise ValueError("Invalid daylight data")
    for date, sunrise, sunset in zip(daily["time"], daily["sunrise"], daily["sunset"]):
        if not isinstance(sunrise, int) or not isinstance(sunset, int) or not 3600 <= sunset - sunrise <= 86400:
            raise ValueError("Invalid sunrise/sunset")
        days.append({"date": datetime.fromtimestamp(date, local_zone).date().isoformat(), "sunrise": sunrise, "sunset": sunset})
    return {"version": 1, "city": "Москва", "timezone": "Europe/Moscow", "fetchedAt": now, "observedAt": observed, **result, "days": days}


def update(output):
    parameters = {"latitude": 55.7558, "longitude": 37.6173, "current": "temperature_2m,weather_code,cloud_cover,wind_speed_10m,precipitation", "daily": "sunrise,sunset", "timezone": "Europe/Moscow", "timeformat": "unixtime", "forecast_days": 2}
    request = Request("https://api.open-meteo.com/v1/forecast?" + urlencode(parameters), headers={"User-Agent": "SilentCity/1.0 (https://city.maark.ru/)"})
    with urlopen(request, timeout=20) as response:
        payload = response.read(65537)
        if len(payload) > 65536:
            raise ValueError("Weather response too large")
        snapshot = normalize(json.loads(payload))
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=output.parent, prefix="weather-", suffix=".tmp", delete=False) as handle:
            temporary = Path(handle.name)
            json.dump(snapshot, handle, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
            handle.write("\n")
        temporary.chmod(0o644)
        os.replace(temporary, output)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()
    print(f"Updated Moscow weather: code {snapshot['code']}, {snapshot['temperature']} C")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch one shared Moscow weather snapshot")
    parser.add_argument("--output", type=Path, required=True)
    arguments = parser.parse_args()
    try:
        update(arguments.output)
    except Exception as error:
        parser.exit(1, f"Weather refresh failed; keeping last snapshot: {error}\n")
