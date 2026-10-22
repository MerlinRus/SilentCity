# Live radio

The SVG city marker “Радио” opens five live stations. These are continuous
third-party broadcasts, not local sound loops. The original café scenes and
30 ambient layers remain available and can be mixed with the broadcast.

| Genre | Broadcaster / station | HTTPS stream |
| --- | --- | --- |
| Rock’n’roll / 1950s–60s oldies | 181.FM Good Time Oldies | `https://listen.181fm.com/181-goodtime_128k.mp3` |
| Lo-fi / chillhop | FluxFM Chillhop | `https://channels.fluxfm.de/chillhop/externalembedflxhp/stream.mp3` |
| Electronic | FluxFM ElektroFlux | `https://channels.fluxfm.de/elektro-flux/externalembedflxhp/stream.mp3` |
| Jazz | FluxFM Xjazz | `https://channels.fluxfm.de/x-jazz/externalembedflxhp/stream.mp3` |
| Blues | 181.FM True Blues | `https://listen.181fm.com/181-blues_128k.mp3` |

Official sources: [181.FM player embeds](https://181.fm/codes),
[FluxFM external player streams](https://www.fluxfm.de/flux-musik-streams).
Station names identify the upstream broadcasters; no affiliation is implied.
Music is neither downloaded into this repository nor relayed by our server.
The CC0 licences in `sounds/` do not apply to these broadcasts.

## Playback and resource use

- Opening the panel makes no third-party request. Playback starts on a user
  action, using one native HTML audio element and the existing Web Audio mixer.
- `crossOrigin="anonymous"` is set before the source URL. No provider scripts,
  iframes, metadata polling, audio decoding into RAM, or new dependencies.
- Selection changes use the existing short gain crossfade. Superseded pending
  connections are disposed, including on pause, mute and page exit.
- Pausing or muting releases the live connection after the volume fade;
  resuming reconnects to the current broadcast rather than old buffered music.
- Failure/ended events offer a manual retry. Availability, adverts and jingles
  depend on the broadcaster. An uninterrupted internet connection is required.
- Streams use mobile data while playing (roughly 58–144 MB/hour at 128–320 kbps).

## Production CSP

Allow media from `listen.181fm.com`, `channels.fluxfm.de`, `streams.fluxfm.de`,
`stream-router.radiosphere.io`, `*.streams.radiosphere.io`, and `*.streamabc.net`
(including all intermediate FluxFM redirect destinations, not just the final
stream host). No external script, iframe or fetch permission is
needed. `deploy/Caddyfile` contains the baseline policy.

The live server also has an unrelated `/father/` proxy route. Preserve that
route and any other server-specific configuration: update only the existing
SilentCity `media-src` directive, validate, and reload Caddy. Do not overwrite
the whole live configuration with the baseline file.
