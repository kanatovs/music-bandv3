#!/usr/bin/env python3
"""Check the static website without third-party Python dependencies."""

from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import sys
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent.parent
EXPECTED_PAGES = {
    "index.html", "tour.html", "about.html", "contact.html", "media-queries.html", "studio.html",
    "explore.html", "account.html", "profile.html"
}
JQUERY_CDN = "https://code.jquery.com/jquery-4.0.0.min.js"
JQUERY_INTEGRITY = "sha256-OaVG6prZf4v69dPg6PhVattBXkcOWQB62pdZ3ORyrao="
FOOTER_TEXT = ("Kanatov Sabyrzhan", "Zhaxylyk Alikhan", "SE-2501")
FORBIDDEN_CONSTRAINTS = {"required", "pattern", "minlength", "maxlength", "min", "max"}
VALIDATION_RULES = {"name", "email", "phone", "password", "confirmPassword", "loginPassword", "message"}
REQUIRED_SCRIPTS = {"js/site.js", "js/script.js", "js/validation.js", "js/theme.js"}
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
        self.forms = []
        self.form_controls = []
        self.validated_controls = []
        self.label_targets = set()
        self.footer_text = []
        self.head_credits = []
        self.background_cycle_buttons = 0
        self.table_headers = 0
        self.table_cells = 0
        self.stack = []
        self.feed(path.read_text(encoding="utf-8-sig"))
        self.close()

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        line = self.getpos()[0]
        if "id" in attrs:
            self.ids[attrs["id"]] += 1
        if tag == "button" and "data-next-background" in attrs:
            self.background_cycle_buttons += 1
        if tag == "th":
            self.table_headers += 1
        if tag == "td":
            self.table_cells += 1
        for name in ("href", "src"):
            if name in attrs:
                self.references.append((name, attrs[name] or "", line))
        if tag == "script" and "src" in attrs:
            self.scripts.append((attrs["src"] or "", line, attrs, "head" in self.stack))
        if tag == "img":
            self.images.append((attrs, line))
        if tag == "form":
            self.forms.append((attrs, line))
        if tag == "label" and attrs.get("for"):
            self.label_targets.add(attrs["for"])
        if tag in {"input", "select", "textarea"} and "form" in self.stack:
            self.form_controls.append((attrs, line))
        if tag in {"input", "select", "textarea"} and "data-validation" in attrs:
            nested_label = any(element == "label" for element in self.stack)
            self.validated_controls.append((attrs, nested_label, line))
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

    def handle_comment(self, data):
        if "head" in self.stack:
            self.head_credits.append(data)


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
        errors.append(f"Unexpected page set; found {sorted(names)}")
    counts = Counter(pages=len(pages))
    if not any(page.table_headers >= 3 and page.table_cells >= 3 for page in pages.values()):
        errors.append("The site must retain a table with at least three column headers and data cells")

    def fail(page, line, message):
        errors.append(f"{page.path.name}:{line}: {message}")

    for page in pages.values():
        if page.background_cycle_buttons != 1:
            fail(page, 1, "Page must have one background-cycle button in Settings")
        head_credits = " ".join(page.head_credits)
        for text in FOOTER_TEXT:
            if text not in head_credits:
                fail(page, 1, f"Head credit comment is missing {text!r}")
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

        loads_jquery_script = False
        loaded_scripts = set()
        for url, line, attrs, in_head in page.scripts:
            parsed = urlsplit(url)
            if parsed.scheme or parsed.netloc:
                if url != JQUERY_CDN:
                    fail(page, line, f"Remote script is not allowed: {url!r}")
                else:
                    loads_jquery_script = True
                    if not in_head or attrs.get("integrity") != JQUERY_INTEGRITY or attrs.get("crossorigin") != "anonymous":
                        fail(page, line, "jQuery must load in the head with its verified integrity hash")
            elif parsed.path:
                target, problem = local_path(page, parsed.path)
                if not problem:
                    loaded_scripts.add(target)
        for script in sorted(REQUIRED_SCRIPTS):
            if (ROOT / script).resolve() not in loaded_scripts:
                fail(page, 1, f"Page does not load the local {script}")
        if not loads_jquery_script:
            fail(page, 1, "Page must load the pinned jQuery CDN")

        for attrs, line in page.images:
            counts["images"] += 1
            if not (attrs.get("alt") or "").strip():
                fail(page, line, "Image must have non-empty alt text")

        for attrs, line in page.forms:
            counts["forms"] += 1
            if "novalidate" not in attrs:
                fail(page, line, "Form must declare novalidate for JavaScript validation")

        for attrs, line in page.form_controls:
            forbidden = sorted(FORBIDDEN_CONSTRAINTS.intersection(attrs))
            if forbidden:
                fail(page, line, f"Form control uses HTML validation constraints: {', '.join(forbidden)}")
            if (attrs.get("type") or "").lower() == "email":
                fail(page, line, "Email validation must use JavaScript instead of type=email")

        for attrs, nested_label, line in page.validated_controls:
            counts["validated controls"] += 1
            identifier = attrs.get("id")
            if not identifier:
                fail(page, line, "Validated control has no ID")
            if attrs.get("data-validation") not in VALIDATION_RULES:
                fail(page, line, f"Unknown validation rule {attrs.get('data-validation')!r}")
            if not nested_label and identifier not in page.label_targets:
                fail(page, line, f"Validated control {identifier!r} has no associated label")
            descriptions = (attrs.get("aria-describedby") or "").split()
            if not descriptions:
                fail(page, line, f"Validated control {identifier!r} has no aria-describedby")
            error_id = f"{identifier}Error"
            if error_id not in descriptions or error_id not in page.ids:
                fail(page, line, f"Validated control {identifier!r} must reference its error element {error_id!r}")
            for description in descriptions:
                if description not in page.ids:
                    fail(page, line, f"aria-describedby target {description!r} does not exist")

        footer = " ".join(" ".join(page.footer_text).split())
        for text in FOOTER_TEXT:
            if text not in footer:
                fail(page, 1, f"Footer is missing {text!r}")

    if errors:
        print("FAIL: static website checks")
        print("\n".join(errors))
        return 1
    summary = ", ".join(f"{value} {key}" for key, value in counts.items())
    print(f"PASS: static website checks ({summary})")
    print("Verified local paths and case, fragment IDs, unique IDs, labels, error messages,")
    print("JavaScript-only form validation, team credits, script sources, image alt text,")
    print("the release table and background-cycle controls.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
