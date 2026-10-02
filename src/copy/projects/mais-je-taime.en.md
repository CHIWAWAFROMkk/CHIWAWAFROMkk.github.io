## Tools and process

- First frames: GPT image generation; the script, storyboard and frame-by-frame review are mine.
- Video: image-to-video in Kling and Jimeng, five seconds per clip.
- Sound: Demucs to separate vocals from the backing, ffmpeg to cut the music; the rain and the gunshots are synthesised in Python.
- Edit: Python, OpenCV and ffmpeg retime each clip to the edit list, desaturate, dissolve and dip to black, then normalise loudness.
- Checks: Python and OpenCV measure rotation, first/end-frame alignment, flash frames and red pixels frame by frame, with fixes in post.

## Next

A 30-second cut from the same material, and another pass at S16, the shot where he is hit.
