# Code study notes

These notes describe the current site. The assignment report is available as [PDF](../report/REPORT.pdf) and [HTML](../report/REPORT.html).

## Layout and accessibility

1. Open an HTML page beside `style.css`. HTML describes structure, CSS controls appearance and `site.js` handles interactions. Each main page uses a semantic header, navigation, main content and footer.
2. On the home page, `row` and `col-lg-6` split a section into two halves from 992px. Release cards use `col-12 col-md-6 col-lg-4`: one column on mobile, two from 768px and three from 992px.
3. Flexbox utilities such as `d-flex`, `flex-column`, `flex-wrap`, `gap-2` and `mt-auto` align content and buttons. Bootstrap's grid also uses Flexbox.
4. `.mq-cards` and `.tour-cards.card-group` use CSS Grid. `grid-template-columns` controls columns; `minmax(0, 1fr)` lets cards shrink without horizontal overflow.
5. `data-bs-toggle="collapse"` and `data-bs-target="#mainNav"` connect the menu button to its panel. Local Bootstrap JavaScript handles the menu and carousel.
6. Labels, field descriptions and error messages identify form controls. `aria-invalid` tracks validation errors; live status regions announce results. The popup uses a native `dialog` for keyboard focus handling.

## Interaction flow

- `site.js` enables forms only when JavaScript is available. A submit handler prevents navigation, validates required fields and displays errors beside each field. Valid input produces a local success message and clears password values. There is no backend, account creation or data storage.
- The contact form requires a name, valid email, an invented password with 8-72 non-whitespace characters, matching confirmation and a non-blank message. Reset clears errors and the result.
- Subscription buttons open the dialog. Its close button, an outside click and Escape close it and return focus to the opener. The newsletter form validates name and email locally.
- FAQ buttons update `aria-expanded`, the panel's `aria-hidden` and `inert` state, and the CSS transition class.
- The background button cycles through four predefined colors. A timer updates the device's local date and time once per second.
- Gallery cards store a year in `data-release-year`. The selected `data-year` filter toggles `hidden`, updates the visible count and sets one `aria-pressed` button. Without JavaScript all nine covers stay visible.

## Practice exercises

| Change | Where to look |
| --- | --- |
| Rename a page heading | The page's `h1` |
| Adjust the accent color | `--accent` and `.btn-primary` in `style.css` |
| Use two desktop release columns | Replace `col-lg-4` with `col-lg-6` on home-page cards |
| Add a demonstration concert | Copy an `article.card` in `.tour-cards`; update its text, image and alternative |
| Change a form result | The submit handler in `site.js` |
| Add a gallery cover | Add a local image, provenance entry and card with a release year; update the expected counts in `tests/browser.cjs` |

After editing, run the commands in the [README](../README.md) and inspect mobile and desktop layouts. Concert information and form results remain demonstrations; external music availability is outside the automated checks.
