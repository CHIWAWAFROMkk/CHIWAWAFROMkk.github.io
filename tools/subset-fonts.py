"""Site-specific Noto Sans SC: keep only the characters this site actually shows.

Reads every text file of a fresh build (dist/), collects the characters, instantiates the variable Noto Sans SC at the two
weights the site uses (300 body, 500 emphasis) and writes, per weight, a small Latin file and a CJK file, each with its
unicode-range — English pages then fetch only the Latin part. Barlow Condensed is converted from TTF to WOFF2.

Usage (after `npm run build`):  py -3.13 tools/subset-fonts.py <path to NotoSansSC[wght].ttf>
Source font: https://github.com/google/fonts/tree/main/ofl/notosanssc (SIL Open Font License 1.1).
"""
import os
import sys
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
DIST, FONTS = ROOT / "dist", ROOT / "public" / "assets" / "fonts"
TEXT = {".html", ".js", ".mjs", ".json", ".md", ".csv", ".txt", ".sql", ".py", ".svg", ".css"}
SKIP = ("vendor", "fonts")                       # third-party runtimes and the fonts themselves carry no page text
WEIGHTS = (300, 500)
LATIN = set(range(0x20, 0x7F)) | set(range(0xA0, 0x100)) | {0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x2192, 0x2190, 0x2191, 0x2193, 0x00D7, 0x2212}


def site_chars() -> set[int]:
    chars: set[int] = set()
    for path in DIST.rglob("*"):
        if path.suffix not in TEXT or any(part in SKIP for part in path.relative_to(DIST).parts):
            continue
        chars.update(ord(c) for c in path.read_text(encoding="utf-8", errors="ignore"))
    # The page sources too: text shown only after an interaction may not be in the static build.
    for path in (ROOT / "src").rglob("*"):
        if path.suffix in {".ts", ".astro", ".md", ".json", ".mjs"}:
            chars.update(ord(c) for c in path.read_text(encoding="utf-8", errors="ignore"))
    # Every CJK punctuation mark and the full-width forms: cheap, and user-typed text often uses them.
    chars.update(range(0x3000, 0x3040))
    chars.update(range(0xFF01, 0xFF5F))
    return {c for c in chars if c >= 0x20}


def unicode_range(codes: set[int]) -> str:
    out, run = [], []
    for c in sorted(codes):
        if run and c == run[-1] + 1:
            run.append(c)
            continue
        if run:
            out.append(f"U+{run[0]:X}" if len(run) == 1 else f"U+{run[0]:X}-{run[-1]:X}")
        run = [c]
    if run:
        out.append(f"U+{run[0]:X}" if len(run) == 1 else f"U+{run[0]:X}-{run[-1]:X}")
    return ", ".join(out)


def subset(font_path: str, weight: int, codes: set[int], out: Path) -> set[int]:
    font = TTFont(font_path)
    font = instantiateVariableFont(font, {"wght": weight}, inplace=False)
    have = set(font.getBestCmap())
    keep = codes & have
    opts = Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.hinting = False
    opts.desubroutinize = True
    s = Subsetter(opts)
    s.populate(unicodes=sorted(keep))
    s.subset(font)
    font.flavor = "woff2"
    font.save(out)
    return keep


def main(src: str) -> None:
    if not DIST.exists():
        sys.exit("dist/ is missing: run `npm run build` first")
    codes = site_chars()
    for old in FONTS.glob("noto-sans-sc-*.woff2"):
        old.unlink()
    faces, covered = [], set()
    for w in WEIGHTS:
        for part, pick in (("latin", lambda c: c in LATIN), ("cjk", lambda c: c not in LATIN)):
            want = {c for c in codes if pick(c)}
            out = FONTS / f"noto-sans-sc-{w}-{part}.woff2"
            keep = subset(src, w, want, out)
            covered |= keep
            faces.append(f"@font-face {{\n  font-family: 'Noto Sans SC';\n  font-style: normal;\n  font-weight: {w};\n  font-display: swap;\n"
                         f"  src: url(fonts/{out.name}) format('woff2');\n  unicode-range: {unicode_range(keep)};\n}}\n")
            print(f"{out.name}: {len(keep)} characters, {os.path.getsize(out):,} bytes")
    head = ("/* Noto Sans SC, subset to the characters this site shows (tools/subset-fonts.py); SIL OFL 1.1, see fonts/NotoSansSC-OFL.txt.\n"
            "   Characters outside the subset (e.g. text a visitor types) fall back to the system font. */\n")
    (ROOT / "public" / "assets" / "fonts.css").write_text(head + "".join(faces), encoding="utf-8")
    (ROOT / "tools" / "font-subset-chars.txt").write_text("".join(chr(c) for c in sorted(covered)), encoding="utf-8")

    barlow = TTFont(FONTS / "BarlowCondensed-Bold.ttf")
    barlow.flavor = "woff2"
    barlow.save(FONTS / "BarlowCondensed-Bold.woff2")
    print(f"BarlowCondensed-Bold.woff2: {os.path.getsize(FONTS / 'BarlowCondensed-Bold.woff2'):,} bytes")


if __name__ == "__main__":
    main(sys.argv[1])
