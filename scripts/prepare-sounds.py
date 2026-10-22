import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import html
import json
from pathlib import Path
import re
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

from mutagen.mp3 import MP3


def fetch(url):
    for attempt in range(5):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(request, timeout=90) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == 4:
                raise
            delay = max(15, int(error.headers.get("Retry-After", 15))) * (attempt + 1)
            print(f'Rate limited; waiting {delay}s', flush=True)
            if delay > 120:
                raise
            time.sleep(delay)


def prepare(track, ffmpeg, root, cache):
    target = root / "sounds" / f'{track["id"]}.mp3'
    if target.exists() and track.get("processingVersion") == 2 and track.get("sha256") == hashlib.sha256(target.read_bytes()).hexdigest():
        print(f'SKIP {track["id"]}: verified', flush=True)
        return track
    print(f'PREPARE {track["id"]}', flush=True)
    page = fetch(track["source"]).decode("utf-8")
    if not re.search(r'href="https?://creativecommons.org/publicdomain/zero/1.0/', page):
        raise ValueError(f'Not a verified CC0 recording: {track["source"]}')
    player = re.search(r'<div\s+class="bw-player"[^>]+>', page).group()
    attributes = dict(re.findall(r'(data-[\w-]+)="([^"]*)"', player))
    source_duration = float(attributes["data-duration"])
    if not track.get("preserveOriginal") and source_duration < 183:
        raise ValueError(f'Source too short: {track["id"]}')
    preview = re.search(r'data-static-file-url="([^"]+)"', page).group(1)
    if not preview.startswith("https://cdn.freesound.org/previews/"):
        raise ValueError("Unexpected preview host")
    if not track.get("preserveOriginal"):
        original = cache / f'{attributes["data-sound-id"]}.mp3'
        if not original.exists():
            print(f'DOWNLOAD {preview}', flush=True)
            original.write_bytes(fetch(preview))
        analysis = subprocess.run([ffmpeg, "-nostdin", "-hide_banner", "-i", str(original), "-af", "volumedetect", "-progress", "pipe:1", "-nostats", "-f", "null", "-"], check=True, capture_output=True, text=True)
        duration = int(re.findall(r'out_time_us=(\d+)', analysis.stdout)[-1]) / 1000000
        mean_volume = float(re.search(r'mean_volume: ([\d.-]+) dB', analysis.stderr).group(1))
        peak_volume = float(re.search(r'max_volume: ([\d.-]+) dB', analysis.stderr).group(1))
        gain = min(-26 - mean_volume, -3 - peak_volume)
        end = duration - 2
        filters = f"[0:a]volume={gain:.3f}dB,asplit=3[main][tail][head];[main]atrim=start=2:end={end},asetpts=PTS-STARTPTS[middle];[tail]atrim=start={end},asetpts=PTS-STARTPTS[ending];[head]atrim=end=2,asetpts=PTS-STARTPTS[starting];[ending][starting]acrossfade=d=2:c1=tri:c2=tri[seam];[middle][seam]concat=n=2:v=0:a=1[out]"
        temporary = cache / f'{track["id"]}-prepared.mp3'
        subprocess.run([ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", str(original), "-filter_complex", filters, "-map", "[out]", "-map_metadata", "-1", "-codec:a", "libmp3lame", "-q:a", "5", "-ar", "44100", str(temporary)], check=True)
        target.write_bytes(temporary.read_bytes())
    info = MP3(target).info
    if not track.get("preserveOriginal") and info.length < 180:
        raise ValueError(f'Prepared recording too short: {track["id"]}')
    track.update({"title": html.unescape(attributes["data-title"]), "author": html.unescape(track["source"].split("/people/")[1].split("/")[0]), "license": "https://creativecommons.org/publicdomain/zero/1.0/", "preview": preview, "sourceDuration": source_duration, "duration": round(info.length, 3), "bytes": target.stat().st_size, "sha256": hashlib.sha256(target.read_bytes()).hexdigest(), "processingVersion": 2, "processing": "original" if track.get("preserveOriginal") else "2-second offline seam crossfade; peak-safe gain toward -26 dB RMS; MP3 VBR q5, 44.1 kHz"})
    print(f'OK {track["id"]}: {info.length:.1f}s, {target.stat().st_size / 1048576:.1f} MiB, CC0', flush=True)
    time.sleep(1.5)
    return track


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ffmpeg", required=True)
    options = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    catalog_path = root / "sounds" / "catalog.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    cache = Path(tempfile.gettempdir()) / "silentcity-sound-sources"
    cache.mkdir(exist_ok=True)
    errors = []
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(prepare, dict(track), options.ffmpeg, root, cache): index for index, track in enumerate(catalog["tracks"])}
        for future in as_completed(futures):
            try:
                catalog["tracks"][futures[future]] = future.result()
                catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            except Exception as error:
                errors.append(error)
                print(f'FAILED {catalog["tracks"][futures[future]]["id"]}: {error}', flush=True)
    if errors:
        raise RuntimeError(f'{len(errors)} recordings failed; rerun to resume') from errors[0]



if __name__ == "__main__":
    main()
