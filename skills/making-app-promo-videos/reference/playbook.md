# Promo video playbook (the full method)

The detail behind SKILL.md. Every number here was measured or corrected on a real project. Sections follow the order you will need them in.

## Contents
1. Project and template map
2. Script → voice → timeline
3. Look and motion system
4. Real product footage
5. Studying reference videos
6. Sound effects
7. Music
8. Checking and exporting
9. DaVinci Resolve hand-off
10. Stock pictures → separate animated pieces
11. Scene recipes
12. Lessons from feedback
13. Troubleshooting

---

## 1. Project and template map
```
template/
  remotion.config.ts      uses the installed Chrome on macOS if present (Remotion's own browser sometimes won't start)
  src/plan.ts             THE structure: SCENES (order, lead, tail, min, sound cues), MUSIC, FPS, size
  src/script.json         one line per scene: id, say (spoken), show (on-screen pieces)
  src/voice-timing.json   written by `npm run voice`, the seconds of each voice line
  src/timeline.ts         places scenes back to back from plan + script + timing
  src/brand.ts            colours, font, name, headline style
  src/Promo.tsx           scene id → component; plays each scene's cues (Sounds.tsx)
  src/Stage.tsx           backdrop + enter/exit: sharpen, push, or whip (sideways slide + motion blur)
  src/Words.tsx           words hop in with the voice; emphasis words in the brand colour
  src/Letters.tsx         letters bounce up one after another (big moments only)
  src/ui.tsx              Phone (3D phone with a camera focus point), fill, Scrim
  src/motion.ts           settle (glide, no bounce), arrive (sharpen + rise + fade), glide
  src/scenes/             Hook, Showcase, Features, Ending (examples to adapt)
  scripts/                make-voice, voice-samples, make-sfx, measure-music, check-cuts,
                          contact-sheet.py, cut-objects.py, make-placeholders.py, export-resolve
```
- Tested with Remotion 4.0.542, React 19.3.1, kokoro-js 1.2.1 and Node 24. `scripts/export-resolve.mjs` and `check-cuts.mjs` import `src/plan.ts` directly, which needs Node ≥ 22.18 or ≥ 23.6 (built-in type stripping). That is why `plan.ts` has **no imports and only erasable TypeScript**.
- Keep the video folder out of the app's git: add it to `.git/info/exclude` or give it its own repo.
- Remotion bundles a cut-down ffmpeg: `npx remotion ffmpeg` / `npx remotion ffprobe`. It supports `scale`, `crop`, `-r`, `-ss`, `-t` and audio resampling. It has **no** `fps` or `tile` filter and no raw video output, so use Python PIL for grids.

## 2. Script → voice → timeline
- Write `say` the way it should sound ("X Keep") and `show` as the short pieces that appear one at a time.
- Voice: Kokoro runs locally under Apache-2.0, so it's free for an ad. `npm run voices -- "line"` writes samples to `voice-samples/`. The person picks by ear; you can't. `make-voice` trims the ends and shortens any pause longer than 0.16 s. Kokoro is deterministic, so re-running it only changes the lines whose text changed. Check with `cmp` against a backup.
- Timeline: scene length = `lead` + voice + `tail` (at least `min`). Scenes follow each other with no gaps. On-screen parts get time by their share of letters. Nothing else holds timings, so never hard-code a frame that a voice change would move. Work from `line.parts[i].from`.
- Adding a scene: add a line to `script.json`, run `npm run voice`, add an entry to `SCENES` in `plan.ts` (with its `sounds`) and a component in `Promo.tsx`.

## 3. Look and motion system
- Take colours and the font from the real app's theme file. Use one font.
- One way of moving (`settle`: glide in and stop, no bounce) for UI. Small springy bounces only for words and letters.
- Transitions: `whip` between two quick thoughts, sharpen/push for calmer moments. A whip = slide about 900–1100 px plus a horizontal SVG blur (`feGaussianBlur stdDeviation="X 0"`).
- Text: short, one thought at a time, lots of space, and one emphasised word in the brand colour. Put "Meet [icon] Name" on one line.
- Put a `Scrim` (fade to the stage colour) under any headline that sits over a phone.
- **Avoid the "AI look":** lavender blur clouds, emoji, sparkle-in-a-circle icons, typing effects, redrawn fake UI cards.

## 4. Real product footage
- Add a developer-only **demo mode** to the app: compiled into debug builds only (`#if DEBUG` on iOS), switched on by a launch argument, with made-up data and no network, sign-in or analytics. Show the person the diff before committing it, and check the release build contains none of it.
- Capture from the simulator with the clock at 9:41 (`xcrun simctl status_bar <udid> override --time 9:41`).
  - Screenshots: `xcrun simctl io <udid> screenshot shot.png`.
  - Recordings: `xcrun simctl io <udid> recordVideo rec.mov`, then stop it with `kill -INT <pid>`, then convert with `npx remotion ffmpeg -i rec.mov -r 30 -c:v libx264 public/app/rec.mp4`.
  - Play recordings with `<OffthreadVideo src={staticFile("app/rec.mp4")} muted />`.
- A realistic notification: `xcrun simctl push <udid> <bundle id> payload.json`. A Messages banner uses `com.apple.MobileSMS`.
- Cut single UI pieces (a banner, a card, one row) so they can float alone. Grab a frame with `npx remotion ffmpeg -ss <t> -i rec.mp4 -frames:v 1 frame.png`, then crop it with PIL. Note each piece's pixel size and corner radius, because scenes need them.
- Set `SCREEN_RATIO` in `ui.tsx` to the captures' height ÷ width.
- Delete simulators and build folders you created afterwards.

## 5. Studying reference videos
- Make grids with `npm run sheet -- references/ad.mp4 2` (2 frames per second; use 3 for fast edits), then look at every sheet.
- What good app promos share:
  - real UI pieces floating alone on a clean stage, tilted in 3D
  - focus on one row while the rest blurs
  - one thought at a time; words or letters bouncing in; one word in the brand colour
  - whip transitions with motion blur; one element growing into the next scene
  - a cursor clicking; pairs of punchy end lines, then the logo
- A common feature-ad structure: hook line → problem → "Welcome to [icon]" → one real UI card at a time (with a cursor) → "Therefore" → notification → rating → "No X. No Y. No Z." → icon + tagline.
- Their sound, measured with `npm run measure` on each reference's audio:
  - most have a continuous, bass-heavy music bed at ~75–82 bpm (or double), at a steady level with a fade at the end
  - ~78 % of picture cuts have a sound hit within 0.2 s
  - 1.3–1.5 sound hits per second

## 6. Sound effects
- Effects are made from scratch in code (`npm run sfx` → `public/sfx/*.wav`): pop, tap, whoosh, blip1–3, ding, impact, drain, chord. They come out identical every time, with no licence issues.
- A smooth whoosh = noise through **three** low-pass filters in a row, cutoff 180 → 1,300 Hz, with a slow swell and fade, ~0.65 s. One filter with a 3,500 Hz top sounds rough.
- List cues in the scene's `sounds` in `plan.ts`, never as `<Sfx>` inside a scene, so the Resolve export gets them too.
- Real phone sounds can be converted with `afconvert -f WAVE -d LEI16@44100 in.caf out.wav`. Warn that Apple's system sounds are not licensed for adverts.

## 7. Music
- `npm run measure -- public/music/song.m4a` prints:
  - loudness every half second (whole mix and bass below 120 Hz)
  - the **drop**, to 10 ms
  - the bar repeat and beat = bar ÷ 4
  - the first bass hits
- Trust the bar repeat over a short-lag guess, which can land on a dotted rhythm. (Check: one song measured drop 8.03 s and beat 0.735 s against 8.04 s / 0.735 s found by hand.)
- Set `MUSIC = { file, drop, beat, anchor, level }`. The drop lands on the first frame of `anchor` (usually the product reveal). If that means the song starts before the video, its opening is skipped automatically.
- `npm run cuts` lists every cut in beats after the drop and how many frames to add to the previous scene's `tail` to reach the nearest whole or half beat.
- Level: **one steady, quiet level the whole way through** (≈0.1 under a voice), with a fade-out only at the end. Don't raise it between voice lines.
- Warn when a song is a commercial release. Platforms may mute or take it down, and an ad needs a licence.

## 8. Checking and exporting
- Stills: `npx remotion still Promo out/st/N.jpeg --frame=N --scale=0.3`. Take 2–3 per scene plus every transition (the cut frame ±3), tile them with PIL into one sheet and look. Check:
  - text on top of the phone or tab bar
  - clipped words
  - placeholders left in
  - empty frames at whips
  - the emphasis colour landing on the right word
- Export with `npm run render` → `out/promo.mp4`.
- Verify the audio by measuring, not assuming. `npx remotion ffprobe -v error -show_entries stream=codec_type,codec_name:format=duration -of csv=p=0 out/promo.mp4` must list an `aac,audio` stream. Then decode to wav and print the peak level per second. If someone hears "no sound" but the measurements show sound, their player was muted: suggest QuickTime.
- Send the file. Delete temporary stills.

## 9. DaVinci Resolve hand-off
- `npm run resolve` writes `out/resolve/`:
  - one silent clip per scene (`--frames=a-b --muted`)
  - copies of every voice, effect and music file
  - `promo.fcpxml` (FCPXML 1.9: scenes in the spine = the cuts; each sound as a connected audio clip with its own lane, position and `adjust-volume`)
  - `cue-sheet.tsv`
- `--no-render` rewrites only the timeline.
- Zip it so it travels as one file: `cd out && zip -r promo-resolve.zip resolve`.
- In Resolve: set the project to the video's fps, then File → Import → Timeline and pick the `.fcpxml`.
- Limits:
  - layers inside a scene are baked into that scene's clip
  - the music fade-out isn't in the file
  - the file is checked as valid XML, but nobody has opened it in Resolve unless you say so

## 10. Stock pictures → separate animated pieces
- `python3 scripts/cut-objects.py <picture> <folder>` (Pillow only). A strict mask numbers the objects. Each then grows into a generous mask at the same speed, so touching objects stay apart. Holes are filled, and each piece is saved 3× larger with a soft edge. Check the result on a coloured background.
- One threshold alone either eats pale paper or merges neighbours. That's why there are two masks.
- Animate each piece on its own:
  - drift in
  - bob and sway out of step with each other
  - small blurred copies in the background for depth
  - leave outwards from the centre with spin and motion blur
- Keep the pieces off the text.

## 11. Scene recipes
- **Hook:** the problem in the viewer's words, one piece at a time (`scenes/Hook.tsx`).
- **Reveal:** "Meet [icon] Name", with the real app on a 3D phone rising and turning to camera (`scenes/Showcase.tsx`). Anchor the music drop here.
- **Key moment:** a real notification floating alone, then the phone rises to show the result.
- **"Even better?"**: a hard cut to black with a punch line and an `impact`.
- **Features:** one sentence per feature, one real UI card each, dropping in tilted and flying up and blurred when the next arrives (`scenes/Features.tsx`).
- **Ending:** tagline → icon + name in bouncing letters (all in the brand colour) → call to action (`scenes/Ending.tsx`), optionally with a live screen recording on a phone rising from below. The chord lands just after the name.

## 12. Lessons from feedback (real corrections)
- "Looks too AI" → use the app's own look and real captures.
- Wants real in-app screens and a realistic demo, not redrawn cards.
- The script must say plainly what the product is ("an expense tracker that logs expenses automatically").
- Don't name one provider in the problem line when the product covers several.
- A rough swoosh → smoother, lower, longer.
- Notifications should sound like the real phone.
- Music must stay consistent and minimal, with no pumping around the voice.
- Pre-launch: "Coming soon" instead of "Try / Download", in the voice and on screen.

## 13. Troubleshooting
| Symptom | Fix |
|---|---|
| Browser fails to launch when rendering | `remotion.config.ts` already uses the installed Chrome on macOS. Elsewhere call `Config.setBrowserExecutable(path)`. The command sandbox may need to be off. |
| `No component for scene "x"` | Add it to `components` in `Promo.tsx`. |
| `script.json has no line with id "x"` | The ids in `plan.ts` and `script.json` must match. |
| Text changed but the timing didn't | Run `npm run voice` again (it rewrites `voice-timing.json`). |
| Node can't import `plan.ts` | Use Node ≥ 22.18, and keep `plan.ts` import-free and erasable-only. |
| "No sound" | Measure the export first (§8). |
| A `REPLACE` label shows in the video | A placeholder from `make-placeholders.py` is still in `public/app/`. |
