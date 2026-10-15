"""Rebuilds the headline font subset (docs/01 8.27).

Keeps GB2312's symbols and its 3,755 level-1 common characters, every Chinese character and full-width mark that
appears under src/, and printable ASCII. Writes the TTF the phone apps bundle and the WOFF2 the web
version loads. Run again after adding interface text:

    python3 -m pip install fonttools brotli
    python3 scripts/subset-font.py path/to/ZCOOLQingKeHuangYou-Regular.ttf

The full font is the OFL release from Google Fonts (ofl/zcoolqingkehuangyou).
"""
import pathlib
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

# Marks the earlier subset carried that GB2312 decoding leaves out.
EXTRA = "\u00a0¢£¥¦©¬¯–—‚„•‥￢"
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "fonts" / "ZCOOLQingKeHuangYou-Subset"


def common_chinese():
    """GB2312 rows 1-9 (punctuation, full-width forms) and level 1 (rows 16-55)."""
    chars = set()
    for high in [*range(0xA1, 0xAA), *range(0xB0, 0xD8)]:
        for low in range(0xA1, 0xFF):
            try:
                chars.add(bytes([high, low]).decode("gb2312"))
            except UnicodeDecodeError:
                pass
    return chars


def interface_text():
    chars = set()
    for path in (ROOT / "src").rglob("*.ts*"):
        chars |= set(re.findall(r"[　-〿一-鿿＀-￯‘-”…·]", path.read_text("utf-8")))
    return chars


def main(source):
    text = "".join(sorted(common_chinese() | interface_text() | {chr(c) for c in range(0x20, 0x7F)} | set(EXTRA)))
    for flavor, suffix in ((None, ".ttf"), ("woff2", ".woff2")):
        font = TTFont(source)
        options = subset.Options()
        options.hinting = False
        subsetter = subset.Subsetter(options)
        subsetter.populate(text=text)
        subsetter.subset(font)
        font.flavor = flavor
        font.save(str(OUT) + suffix)
        print(f"{OUT.name}{suffix}: {(OUT.parent / (OUT.name + suffix)).stat().st_size // 1024} KB")


if __name__ == "__main__":
    main(sys.argv[1])
