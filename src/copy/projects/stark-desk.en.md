## What is on the desk

| Object | Click it and… |
|---|---|
| Gold helmet | Put on the HUD: every object gets a lock box and a scan label, and the pointer becomes a repulsor reticle; from the HUD you can also start a timed repulsor training round against flying drones |
| Phone with a call from Happy | It buzzes and rings; answer and Happy speaks, then hands over my email |
| Donut burger | It really loses a bite, and the scale reading drops |
| Potato cannon | A potato arcs across the desk |
| Nanotech hologram | A 3D glove assembled live from thousands of hexagonal nanotech cells, drag to rotate; my projects are listed below it |
| JARVIS display | Preset questions, and typed or spoken commands: “go to the ink-wash universe”, “suit up”, “start training”, “call Happy” (in Chinese or English) |
| *GENIUS QUARTERLY* magazine | My experience, written as a cover story; you can also type your name and get a cover starring you, with your run on the desk, as a download |
| A dozen more | Repulsor beam, reactor overload, laser engraving, tool calibration, label stickers, tinted sunglasses… |

## How it was made

- **Pictures:** generated with GPT image generation. The first version looked generated and the layout felt staged, so I rewrote the prompt to group things by use (exhibits on the cabinet behind, everyday items within reach of the right hand, a clear working area in the middle), gave every object its real size, and switched the style to interior photography. The other nine universes are re-painted from the first picture as a reference, so the composition barely moves and objects stay in place when you switch. The default workshop also follows your local time, with day, dusk and night versions re-painted the same way, and JARVIS can switch between them.
- **The click mask follows the final picture:** re-painting moves objects around, so instead of forcing the picture to match a draft, the mask is cut from the final image. OWLv2 finds each object by name, the candidate nearest its expected position is chosen, and SAM 2.1 cuts the outline; objects it misses get correction points, and each mask is compared with the default universe to flag drift. Every one of the 21 objects in all 10 universes was checked by eye.
- **Lift and parallax:** each object is cut into its own layer and lifts on hover. Depth Anything estimates depth, a WebGL shader shifts the picture by depth, and clicks are shifted back the same way before the mask lookup, so clicks stay accurate while the scene moves.
- **3D and commands:** the nanotech glove is a Three.js instanced mesh, loaded only when the hologram is opened; JARVIS understands commands through local keyword matching, with no AI service, and voice input appears only where the browser has built-in speech recognition.
- **Sound:** every effect is synthesised live with Web Audio; there are no audio files. JARVIS and Happy speak with the browser's built-in voice, with subtitles when no voice is available.
- **Tests:** 29 for segmentation and layers (Python) and 70 end-to-end interaction tests on desktop and phone, including switching universes mid-action, multi-touch, no WebGL and no speech synthesis.

## Limits

- Inspired by Iron Man, this is a non-commercial fan work: people appear only from behind, the props are original designs, and no Marvel names, logos, fonts or film material are used. Red-and-gold armour was blocked by the image generator's safety review, so the armour is plain gold-titanium.
- All lines and answers are pre-written. The page calls no AI service and does not record visitors' clicks; exploration progress stays in your own browser.
- The background revealed by the burger's bite marks is filled in automatically, not newly generated.
