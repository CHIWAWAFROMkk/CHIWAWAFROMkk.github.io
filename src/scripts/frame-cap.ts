/** At most about 60 frames a second on any display. Frames are kept on a 60 Hz beat rather than "15 ms after the last
 *  drawn frame", which on 75, 90 or 144 Hz displays would draw only every other or third callback (37–48 fps). */
export function frameCap(fps = 60): (now: number) => boolean {
  const step = 1000 / fps;
  let beat = NaN;
  return now => {
    if (Number.isNaN(beat)) { beat = now; return true; }
    if (now - beat < step - 1) return false;                              // 1 ms slack for callback jitter
    beat += Math.floor((now - beat + 1) / step) * step;                    // the latest beat at or just before now
    return true;
  };
}
