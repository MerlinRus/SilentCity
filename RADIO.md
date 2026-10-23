# Live radio

The SVG city marker “Радио” opens five live stations. These are continuous
third-party broadcasts, not local sound loops. The original café scenes and
30 ambient layers remain available and can be mixed with the broadcast.

## Radio room

The marker opens a native fullscreen dialog containing an SVG receiver.
Five genre presets, previous/next station buttons, playback, a volume dial
and the live connection status share the existing audio engine. Opening the
room never starts audio or requests a stream. Returning to the city keeps an
already-playing broadcast and the ambient mix; “Свой микс” opens the mixer.
Choosing a preset or stepping to another genre stops the previous radio stream
without stopping ambient layers. Only “Пуск” opens the selected live connection;
changing either volume control cannot start a stopped radio.

Pointer entry and return use one 300 ms opacity crossfade on the dialog.
The complex city SVG is never scaled or transformed for this transition:
the previous 1.9× camera enlarged its raster area 3.61× and also animated
multiple HUD surfaces. City life and rain pause while the room is open.
Finished or interrupted fades are cancelled and the covered city is hidden.
Escape, keyboard use and reduced motion skip the fade. Resize, backgrounding
and rapid return finish or cancel pending transitions safely.
Reopening the radio reuses the receiver DOM if no other room replaced it;
event handlers and SVG markup are not rebuilt on every visit.

The receiver uses inline SVG and a small scoped stylesheet, without raster
images, new fonts, libraries, visualizer loops or metadata polling.
Adjusting volume updates the current gain without reconnecting a healthy
stream. On narrow screens the speaker is omitted and controls stack; the
native dialog scrolls vertically when needed and retains keyboard focus.
The circular SVG dial supports mouse/touch rotation and keyboard arrows,
Page Up/Down and Home/End. It shares its value with the native range control.

| Genre | Broadcaster / station | HTTPS stream |
| --- | --- | --- |
| Rock’n’roll / 1950s–60s oldies | 181.FM Good Time Oldies | `https://listen.181fm.com/181-goodtime_128k.mp3` |
| Lo-fi / chillhop | FluxFM Chillhop | `https://channels.fluxfm.de/chillhop/externalembedflxhp/stream.mp3` |
| Electronic | FluxFM ElektroFlux | `https://channels.fluxfm.de/elektro-flux/externalembedflxhp/stream.mp3` |
| Jazz | 181.FM BeBop | `https://listen.181fm.com/181-bebop_128k.mp3` |
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
- Selection changes stop the old stream and require “Пуск”. Superseded pending
  connections are disposed, including on stop, mute and page exit.
- Pausing or muting releases the live connection after the volume fade;
  resuming reconnects to the current broadcast rather than old buffered music.
- Failure/ended events offer a manual retry. Availability, adverts and jingles
  depend on the broadcaster. An uninterrupted internet connection is required.
- Each connection has a 12-second deadline. A failed lo-fi/electronic/jazz
  connection tries one alternative, without background retry loops. Lo-fi falls
  back to 181.FM Chilled (calm electronic music, not identical chillhop), electronic
  to 181.FM Energy 98, and jazz to FluxFM Xjazz. The display identifies the actual
  provider. A browser autoplay denial does not trigger another provider.
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
