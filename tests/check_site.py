"""Validate local resources, anchors and cover provenance without a server."""
from collections import Counter
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.ids = []
        self.references = []
        self.errors = []
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if "id" in attributes:
            self.ids.append(attributes["id"])
        if tag == "img" and "alt" not in attributes:
            self.errors.append("image missing alt")
        for key in ("href", "src"):
            if attributes.get(key):
                self.references.append(attributes[key])


def main():
    pages = {path.name: Page(path) for path in ROOT.glob("*.html")}
    errors = []
    checked = 0
    for name, page in pages.items():
        errors.extend(f"{name}: {error}" for error in page.errors)
        errors.extend(f"{name}: duplicate id {key}" for key, count in Counter(page.ids).items() if count > 1)
        for reference in page.references:
            url = urlsplit(reference)
            if url.scheme or url.netloc:
                continue
            checked += 1
            destination = ROOT / unquote(url.path) if url.path else page.path
            if not destination.is_file():
                errors.append(f"{name}: missing resource {reference}")
            elif url.fragment and destination.name in pages:
                if unquote(url.fragment) not in pages[destination.name].ids:
                    errors.append(f"{name}: missing anchor {reference}")
            # Case must also work on the case-sensitive GitHub Pages server.
            if url.path and destination.exists():
                part = ROOT
                for segment in Path(unquote(url.path)).parts:
                    if segment not in {child.name for child in part.iterdir()}:
                        errors.append(f"{name}: incorrect path case {reference}")
                        break
                    part /= segment
    covers = json.loads((ROOT / "assets/covers/sources.json").read_text(encoding="utf-8"))
    for cover in covers:
        file = ROOT / cover["file"]
        if not file.is_file() or hashlib.sha256(file.read_bytes()).hexdigest() != cover["sha256"]:
            errors.append(f"cover checksum mismatch: {cover['file']}")
    if errors:
        raise SystemExit("\n".join(errors))
    print(f"PASS: {len(pages)} pages, {checked} local references, {len(covers)} cover checksums")


if __name__ == "__main__":
    main()
