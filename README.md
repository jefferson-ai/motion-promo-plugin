# motion-promo

A Claude Code plugin for making short app promo videos in code with [Remotion](https://www.remotion.dev/).
It is the method behind the XKEEP promo, written down so it can be reused.

- **The skill (`making-app-promo-videos`):** Claude loads it automatically when you ask for a promo, launch or "coming soon" video. It covers the brief, voice, real app footage, music, checking and export.
- **A starter project (`skills/making-app-promo-videos/template/`):** four example scenes (hook, product reveal, features, ending) and the scripts listed below. Everything is timed to the voice-over from one file, `src/plan.ts`.
  - local voice-over (Kokoro, free for ads)
  - sound effects generated in code
  - song drop and beat measurement
  - a cuts-on-the-beat check
  - reference-video contact sheets
  - stock-picture cut-outs
  - a DaVinci Resolve export
- **The full playbook:** `skills/making-app-promo-videos/reference/playbook.md`.

## Install

In a terminal running `claude`:

```
/plugin marketplace add ~/Desktop/motion-promo-plugin
/plugin install motion-promo@motion-promo-local
```

Or straight from GitHub:

```
/plugin marketplace add jefferson-ai/motion-promo-plugin
/plugin install motion-promo@motion-promo-local
```

## Start a new video

```
cp -R ~/Desktop/motion-promo-plugin/skills/making-app-promo-videos/template my-promo
cd my-promo && npm install
python3 scripts/make-placeholders.py && npm run sfx && npm run voice
npm run preview
```

Requirements: Node 22.18 or newer, Python 3 with Pillow, and Chrome (macOS). `node_modules` takes about 1 GB, so delete it when the video is finished.

## What's not included
No music, fonts, app screenshots or stock pictures ship with this plugin. Bring your own, licensed for advertising.
The placeholder pictures are marked REPLACE.

## Licence
MIT. See [LICENSE](LICENSE).
