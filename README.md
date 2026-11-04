# Music Band - Cold Carti Fan Archive

A responsive fan website built with HTML, CSS, JavaScript, jQuery and local Bootstrap files.

**Website:** https://kanatovs.github.io/music-bandv3/
**Team:** Kanatov Sabyrzhan and Zhaxylyk Alikhan, SE-2501

## Pages

- `index.html`: releases, cover carousel and a gallery with a year filter.
- `tour.html`: demonstration concert cards.
- `about.html`: project information, team and FAQ.
- `contact.html`: a two-step contact form with JavaScript validation.
- `studio.html`: cover gallery, ratings, filtering and a personal release collection.
- `explore.html`: live archive search, suggestions, highlighting and sharing.
- `media-queries.html`: standalone responsive release selection.

## Assignment 4

- The contact form checks required fields, email, password length and matching passwords. Errors appear beside the fields.
- FAQ answers start closed and open or close when their question is clicked.
- A Subscribe button opens a popup. The close button, outside click and Escape close it.
- The background button cycles through four colors.
- The current date and time update every second.

Shared controls are available on the main pages. The contact password must contain 8-72 characters without whitespace. Forms are local demos: they do not send or save data or create accounts.

The Assignment 4 report is available as [PDF](report/REPORT.pdf) and [editable HTML](report/REPORT.html).

## Assignment 5

| Requirement | Where to see it |
| --- | --- |
| DOM selection, text and attribute changes | Studio thumbnails update the large cover, title and image description; stars update the selected rating |
| Dynamic styles and animations | Selected cards and stars change appearance; changing a cover and adding a collection item trigger animations |
| Button and keyboard events | Studio controls respond to clicks; arrow keys, Home and End move focus through the navigation links |
| Callbacks | Contact form Next and Back buttons call a function that changes the visible step while keeping field values |
| Switch statements | Year filtering in `music-library.js` and navigation keys in `site.js` |
| Objects, arrays, loops and higher-order functions | The catalogue and collection methods manage releases; `for...of` builds cards and `.filter()` searches them |
| Sound | The Studio sound button plays one short local signal; repeated clicks reuse the same audio element |

The collection and ratings last until the page is reloaded. The sound is an interface signal, not a music track. Search and filtering work locally without an API. Reduced-motion preferences disable the new animations.

See the [Assignment 5 PDF report](report/assignment-5/REPORT.pdf) and [code walkthrough and practice](report/assignment-5/DEFENSE.md).

## Assignment 6

| Task | Implementation |
| --- | --- |
| 0. Setup | Pinned jQuery 4.0.0 CDN in each page's head; `script.js` uses `$(document).ready()` and logs `jQuery is ready!` |
| 1. Live search | `archive-search.js` filters release titles and descriptions while typing, together with the selected year |
| 2. Autocomplete | Up to five title suggestions; mouse, arrow keys, Enter and Escape are supported |
| 3. Highlighting | All literal query occurrences in release text and archive notes are wrapped in safe `mark` elements |
| 4. Scroll progress | A gradient bar follows the actual scroll position of the Explore page |
| 5. Counters | Archive statistics count up once when visible; reduced-motion preferences skip the animation |
| 6. Submit spinner | Validated forms show a spinner, disable buttons for 1.6 seconds and then restore them; edits cancel a pending check |
| 7. Notifications | jQuery fade effects show temporary feedback for filters, suggestions, copying and valid forms |
| 8. Clipboard | Copy buttons write a release title or archive link, show a checkmark and a tooltip after success |
| 9. Lazy images | jQuery scroll/offset checks replace placeholder sources only when a visible card enters the viewport |

The required CDN has a verified integrity hash. An identical local jQuery copy is used if the CDN is unavailable, so the downloaded project can also run offline. The full build includes effects. Clipboard access needs HTTPS or localhost and can be refused by browser settings; failure shows manual-copy feedback.

Forms remain local demonstrations. The delay simulates checking; it does not contact a server or save data. The shared strict email validation runs before the loading state. Old reports and features are retained.

See the [Assignment 6 PDF report](report/assignment-6/REPORT.pdf) and [defense notes](report/assignment-6/DEFENSE.md).

## Run locally

Open `index.html` after downloading the project, or run this command in its folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000/ or http://localhost:8000/explore.html. No build or package installation is needed.

## Checks

```bash
node --check site.js
node --check music-library.js
node --check studio.js
node --check archive-search.js
node --check script.js
node --test checks/studio.test.cjs checks/email.test.cjs
python checks/check_site.py
```

The tests check collection operations, rating limits, year filtering and email syntax. Both forms reject malformed addresses, including commas, repeated dots, multiple @ signs and invalid domain characters. The static checker checks local files, anchors, labels, IDs, image alternatives and footer credits. The Assignment 5 report records browser checks. Firefox and Safari have not been checked.

## Hosting and assets

GitHub Pages is configured to serve the root of `main`. Keep `.nojekyll` in the project root.

Cover images belong to their rightsholders; sources are listed in `assets/covers/sources.json`. Bootstrap license notes are in `assets/vendor/bootstrap/`. This is an unofficial educational fan project.
