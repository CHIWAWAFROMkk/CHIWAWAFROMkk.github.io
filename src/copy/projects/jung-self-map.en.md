## Five quotations

The subtitles are excerpts from English translations of Jung’s writings and letters (translated by R. F. C. Hull); omissions are marked with ellipses. Volume and paragraph numbers were checked one by one against the paragraph markers of the *Collected Works* in English; they refer to the paragraph numbers of the scanned edition, not to printed page numbers. The Chinese subtitles in the film are my own paraphrase, not an official translation.

| Shot | Quotation | Source |
|---|---|---|
| The mask | A kind of mask … to conceal the true nature of the individual. | CW 7 §305 |
| The eye | Who looks outside, dreams; who looks inside, awakes. | Letter to Fanny Bowditch, 22 October 1916 |
| The complex | … complexes can have us. | CW 8 §200 |
| The shadow | The meeting with oneself is, at first, the meeting with one's own shadow. | CW 9i §45 |
| The turn | Whoever looks into the mirror of the water will see first of all his own face. | CW 9i §43 |

## How it was made

- **Pictures:** the keyframes are generated with GPT image generation. Seventy-nine motion states (twelve of them in-between pictures) are joined automatically according to how much two neighbouring pictures differ: a continuous dissolve, a push-through, a short dip to black, or a hard cut.
- **Edit data:** one edit list is the single source of truth. Pictures, subtitles and sound all read it, so when a voice line changes, the shots and subtitles re-time themselves to the line’s real length.
- **Rendering:** every frame is composed by a WebGL shader: two-layer crossfade, zoom and the impact shake. Rendering is deterministic — the same time always yields the same frame.
- **Sound:** the voice-over is generated with Jimeng Seedance; I chose the takes, lowered the pitch, shortened over-long pauses, added breath and room reverb, and levelled every line to the same loudness. The impact is synthesized in code, with no metallic ring; the music keeps one constant level from start to end, does not rise and fall with the voice, and shares the same room reverb as the voice.
- **Map:** Three.js is bundled locally, with no external requests. Each of the seven stations marks the verification status of its citation; “the gaze of the other” is a narrative theme, not a Jungian term, and the page says so.
- **Tests:** the edit data, the audio mix and the map content each have automated tests — including that the voice is never buried, that the impact is the loudest moment, and that peaks keep headroom (96 Python tests, 24 renderer tests, 44 map tests).

## Limits

- Pictures and voice are AI-assisted; the quotations are excerpts from English translations, and the Chinese lines in the film are paraphrase.
- The music is “Alone Again” from TunePocket, used under a licence; I took one section, removed the vocals, and aligned it to the film’s rhythm.
- The personal statements on the map are abstract feelings, with no specific events. It is a personal story, not a psychological test, and outputs no score or type.
