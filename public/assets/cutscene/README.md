# Opening cutscene assets

Created for Aurora Station on 2026-11-15 using OpenAI image generation:

- `aurora-base.png`: fictional launch facility at dawn, with prior NASA branding removed.
- `aurora-rocket.png`: separate transparent rocket with prior NASA insignia and lettering removed, moved with CSS for liftoff.
- `cockpit.png`: fictional four-seat crew capsule interior overlooking Earth.

Crew sprites and station modules are reused from the existing game, without replacing their originals.
The project logo from `public/aurora-logo.png` is used as a reference for `aurora-base-painted.png` and `aurora-rocket-painted.png`: image-generation edits integrating muted paint, surface texture, perspective and lighting into each illustration. The rocket also carries the painted AURORA name. `LaunchBranding.tsx` renders these versions without separate logo overlays. The clean `aurora-base.png` and `aurora-rocket.png` remain available for comparison. Original pre-edit artwork is archived in `src/assets/cutscene/_source/` and is not served by the game.
The cutscene visibly labels AI-generated scenery. All narration is DOM text, not painted into images.
The soundtrack is the user-supplied `audioatlant-total-war-epic-action-cinematic-trailer-main-513668.mp3`, copied as `trailer-music.mp3`. Its decoded duration is 70.55675 seconds. The opening preserves the original beginning, uses audio-clock cues around the measured impacts, and fades from 47 to 49 seconds without modifying the source audio. Playback begins from a user gesture and can be paused, muted or skipped.

Only the arrival scene uses the whole station. Mission responsibilities use the existing greenhouse, life-support node and lab artwork; the final scene closes the transmission and fades into the crew presentation.
The cockpit overlays only the crowns of the selected crew's rear-facing heads above the four seat backs, using the existing `back` atlas frames. The six-to-nine-month journey has its own dark title card at 28.6 seconds.

The opening reads the mission duration from `src/data/missionLength.ts` (45 days), matching the gameplay calendar integrated from main.

Accessibility: the start screen offers built-in English narration with music capped at 10%, including short scene descriptions. Reducing the cutscene music slider to 10% or below also enables narration. The audio clock pauses at scene boundaries until speech finishes; narration therefore may extend the total runtime. Narration depends on the browser's installed voices. Full captions remain available to the existing Read button.
