---
name: making-app-promo-videos
description: Use when making a short promo, launch, teaser or "coming soon" video for an app or product (vertical reels/TikTok/Shorts or landscape), a motion-graphics ad with voice-over, kinetic text and real UI screens, or when a promo video looks "too AI", has no sound, or its cuts don't sit on the music.
---

# Making app promo videos

## Overview
A code-built (Remotion) promo where **everything is timed to the voice**, the product is shown with **real captures, not mock-ups**, and one file (`src/plan.ts`) holds the structure. A working starter project is in `template/`.

**You cannot watch motion or hear sound.** You check still frames and measure audio; the person judges feel by eye and ear. Say so in every report.

## Workflow
1. **Brief: ask before building.** Story in their words (problem → product → 1–2 key moments → "even better" → call to action), shape and length (1080×1920, ~25–35 s), where it's posted, voice or not, music or not, reference videos. Pre-launch → the call to action is "Coming soon", not "Download".
2. **Check every supplied asset first.** Use `sips -g pixelWidth -g pixelHeight -g hasAlpha` to check its size and whether it has transparency, then look for a watermark and check the licence. A preview copy is only a stand-in, so ask for the real file.
3. **Scaffold.** Copy `template/` to the project's own folder (keep it out of the app's git), then run `npm install`. This needs Node ≥ 22.18; the first `npm run voice` also downloads the ~80 MB Kokoro voice model. Placeholder pictures (marked REPLACE) and sound effects already ship, and you can rebuild them with `python3 scripts/make-placeholders.py` / `npm run sfx`. The example copy is for a budget app. Rewrite all of it: `script.json`, the emphasis words in `scenes/Hook.tsx`, and the `features` array (piece files, sizes, emphasis) in `scenes/Features.tsx`.
4. **Brand.** Set `src/brand.ts` from the app's real colour file and font, not from taste. The logo goes in `public/app/icon.png` and must be square. Check it has transparency or a solid background that suits the stage.
5. **Script and voice.** Fill `src/script.json` (`say` = spelled the way it sounds, `show` = short on-screen pieces). Run `npm run voices -- "test line"` and let the person pick a voice by ear. Then run `VOICE=… npm run voice`.
6. **Scenes.** A new scene needs four edits: `src/scenes/X.tsx`, an entry in `SCENES` in `plan.ts` (with its sound cues, which assume the line has the parts they index), its line in `script.json`, and the `components` map in `Promo.tsx`. Never time anything by hand.
   **Length** = voice + each scene's `lead`/`tail`. Run `npm run cuts` to see the total. To hit a target, shorten the script first, then trim tails.
7. **Real footage.** Take simulator captures from a debug-only demo mode with made-up data. If you have no app source, use the person's screenshots or screen recordings of the real app instead. Cut single UI pieces out to float alone. Replace every `REPLACE` placeholder.
8. **Music, if any.** Any format ffmpeg reads works (m4a, mp3, wav). If the song isn't licensed for ads, build with it as a draft stand-in, say so in every report, and ask for a licensed or royalty-free track before anything is posted. Run `npm run measure -- public/music/song.m4a`, put the drop and beat into `MUSIC`, anchor the drop on the product reveal, then run `npm run cuts` and adjust the tails until the cuts land on beats.
9. **Check, then export.** Render 2–3 stills per scene plus every transition, tile them and look. Fix and repeat. Then `npm run render`, measure the export's audio, and send the file.
10. **Hand-off.** If they want to edit in DaVinci Resolve, run `npm run resolve` (FCPXML + clips + cue sheet), zipped.
11. **Report.** Say what changed, how it was checked (stills, measurements), what only they can judge, and which decisions are still open.

## Quick reference
| Task | Command (inside the project) |
|---|---|
| Live preview | `npm run preview` |
| One frame | `npx remotion still Promo out/f.jpeg --frame=N --scale=0.3` |
| Voice samples / voice | `npm run voices -- "line"` · `VOICE=af_bella SPEED=1.05 npm run voice` |
| Study a reference video | `npm run sheet -- references/ad.mp4 2` → `out/sheets/` |
| Cut objects from a stock picture | `python3 scripts/cut-objects.py pic.png public/pieces` |
| Song drop / beat · cuts on beat | `npm run measure -- <song>` · `npm run cuts` |
| Export · Resolve | `npm run render` · `npm run resolve` |

Details, measurements and the reasons behind each rule are in `reference/playbook.md`. Read it for: real-footage capture, studying reference videos, the motion system, sound effects, music, Resolve, and object cut-outs.

## Common mistakes
- **"Looks too AI."** Lavender blur clouds, emoji, sparkles in circles, a typing effect, redrawn cards. Use the app's own look and real captures instead.
- **Music that pumps around the voice.** Keep one steady quiet level (≈0.1) and fade only at the end.
- **Naming one provider or feature** when the product covers several. Say plainly what the product *is*.
- **Saying "it has no sound" without measuring.** Probe the export's audio stream and peak levels before re-rendering; the in-app preview may simply be muted.
- **Shipping someone else's asset.** That includes commercial songs, Apple system sounds and watermarked previews. Warn about the licence.
- **Leaving test leftovers.** Delete stills, scratch projects and samples afterwards; `node_modules` is about 1 GB.
