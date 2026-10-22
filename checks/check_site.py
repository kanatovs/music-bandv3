#!/usr/bin/env python3
"""Check the static website without third-party Python dependencies."""

from collections import Counter
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent.parent
EXPECTED_PAGES = {
    "index.html", "tour.html", "about.html", "contact.html", "media-queries.html"
}
FOOTER_TEXT = ("Kanatov Sabyrzhan", "Zhaxylyk Alikhan", "SE-2501")
VOID_ELEMENTS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids = Counter()
        self.references = []
        self.scripts = []
        self.images = []
        self.required_controls = []
        self.label_targets = set()
        self.footer_text = []
        self.stack = []
        self.feed(path.read_text(encoding="utf-8-sig"))
        self.close()

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        line = self.getpos()[0]
        if "id" in attrs:
            self.ids[attrs["id"]] += 1
        for name in ("href", "src"):
            if name in attrs:
                self.references.append((name, attrs[name] or "", line))
        if tag == "script" and "src" in attrs:
            self.scripts.append((attrs["src"] or "", line))
        if tag == "img":
            self.images.append((attrs, line))
        if tag == "label" and attrs.get("for"):
            self.label_targets.add(attrs["for"])
        if tag in {"input", "select", "textarea"} and "required" in attrs:
            nested_label = any(element == "label" for element in self.stack)
            self.required_controls.append((attrs, nested_label, line))
        if tag not in VOID_ELEMENTS:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attributes):
        self.handle_starttag(tag, attributes)
        if tag not in VOID_ELEMENTS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag in self.stack:
            index = len(self.stack) - 1 - self.stack[::-1].index(tag)
            del self.stack[index:]

    def handle_data(self, data):
        if "footer" in self.stack:
            self.footer_text.append(data)


def local_path(page, url_path):
    """Resolve a URL path and verify the exact case of every path component."""
    decoded = unquote(url_path).replace("\\", "/")
    current = ROOT if decoded.startswith("/") else page.path.parent
    for part in decoded.split("/"):
        if part in {"", "."}:
            continue
        if part == "..":
            current = current.parent
            continue
        if not current.is_dir():
            return current / part, "parent directory does not exist"
        names = {child.name for child in current.iterdir()}
        if part not in names:
            matches = [name for name in names if name.casefold() == part.casefold()]
            reason = f"wrong case; expected {matches[0]!r}" if matches else "missing file"
            return current / part, reason
        current /= part
    if not current.is_file():
        return current, "target is not a file"
    return current.resolve(), None


def main():
    errors = []
    pages = {path.resolve(): Page(path) for path in sorted(ROOT.glob("*.html"))}
    names = {page.path.name for page in pages.values()}
    if names != EXPECTED_PAGES:
        errors.append(f"Expected exactly five pages; found {sorted(names)}")
    counts = Counter(pages=len(pages))

    def fail(page, line, message):
        errors.append(f"{page.path.name}:{line}: {message}")

    for page in pages.values():
        for identifier, count in page.ids.items():
            if not identifier or count > 1:
                fail(page, 1, f"Invalid or duplicate ID {identifier!r} ({count} occurrences)")

        for attribute, url, line in page.references:
            parsed = urlsplit(url)
            if parsed.scheme or parsed.netloc:
                continue
            if not parsed.path:
                target, problem = page.path.resolve(), None
            else:
                target, problem = local_path(page, parsed.path)
                counts["local files"] += 1
            if problem:
                fail(page, line, f"{attribute}={url!r}: {problem}")
                continue
            if attribute == "href" and parsed.fragment:
                counts["fragments"] += 1
                fragment = unquote(parsed.fragment)
                target_page = pages.get(target)
                if target_page is not None and fragment not in target_page.ids:
                    fail(page, line, f"href={url!r}: target ID {fragment!r} does not exist")

        loads_site_script = False
        for url, line in page.scripts:
            parsed = urlsplit(url)
            if parsed.scheme or parsed.netloc:
                fail(page, line, f"Remote script is not allowed: {url!r}")
            elif parsed.path:
                target, problem = local_path(page, parsed.path)
                loads_site_script |= not problem and target == (ROOT / "site.js").resolve()
        if not loads_site_script:
            fail(page, 1, "Page does not load the local site.js")

        for attrs, line in page.images:
            counts["images"] += 1
            if not (attrs.get("alt") or "").strip():
                fail(page, line, "Image must have non-empty alt text")

        for attrs, nested_label, line in page.required_controls:
            counts["required controls"] += 1
            identifier = attrs.get("id")
            if not nested_label and identifier not in page.label_targets:
                fail(page, line, f"Required control {identifier!r} has no associated label")
            descriptions = (attrs.get("aria-describedby") or "").split()
            if not descriptions:
                fail(page, line, f"Required control {identifier!r} has no aria-describedby")
            for description in descriptions:
                if description not in page.ids:
                    fail(page, line, f"aria-describedby target {description!r} does not exist")

        footer = " ".join(" ".join(page.footer_text).split())
        for text in FOOTER_TEXT:
            if text not in footer:
                fail(page, 1, f"Footer is missing {text!r}")

    # Check the report's nested resources without applying site footer rules to it.
    report = Page(ROOT / "report/REPORT.html")
    for attribute, url, line in report.references:
        parsed = urlsplit(url)
        if not parsed.scheme and not parsed.netloc and parsed.path:
            _, problem = local_path(report, parsed.path)
            if problem:
                fail(report, line, f"{attribute}={url!r}: {problem}")
            counts["document resources"] += 1

    # README previews and study-note links must survive publishing to GitHub.
    for document in [ROOT / "README.md", *sorted((ROOT / "docs").glob("*.md"))]:
        document_page = Page(document)
        for reference in re.findall(r"!?\[[^\]]*\]\(([^)]+)\)", document.read_text(encoding="utf-8")):
            parsed = urlsplit(reference)
            if not parsed.scheme and not parsed.netloc and parsed.path:
                _, problem = local_path(document_page, parsed.path)
                if problem:
                    errors.append(f"{document.relative_to(ROOT)}: {reference!r}: {problem}")
                counts["document resources"] += 1

    covers = json.loads((ROOT / "assets/covers/sources.json").read_text(encoding="utf-8"))
    for cover in covers:
        cover_file, problem = local_path(pages[(ROOT / "index.html").resolve()], cover["file"])
        if problem or hashlib.sha256(cover_file.read_bytes()).hexdigest() != cover["sha256"]:
            errors.append(f"Cover checksum mismatch: {cover['file']}")
        counts["cover checksums"] += 1

    if errors:
        print("FAIL: static website checks")
        print("\n".join(errors))
        return 1
    summary = ", ".join(f"{value} {key}" for key, value in counts.items())
    print(f"PASS: static website checks ({summary})")
    print("Verified local paths and case, fragment IDs, unique IDs, required labels and")
    print("descriptions, footer credits, local site.js, script sources, image alt text,")
    print("documentation resources, and cover checksums.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
