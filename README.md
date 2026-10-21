# Music Band - Cold Carti Fan Archive

A responsive fan website built with HTML, CSS, JavaScript and local Bootstrap files.

**Website:** https://kanatovs.github.io/music-bandv3/
**Team:** Kanatov Sabyrzhan and Zhaxylyk Alikhan, SE-2501

## Pages

- `index.html`: releases, cover carousel and a gallery with a year filter.
- `tour.html`: demonstration concert cards.
- `about.html`: project information, team and FAQ.
- `contact.html`: contact form with JavaScript validation.
- `media-queries.html`: standalone responsive release selection.

## Assignment 4

- The contact form checks required fields, email, password length and matching passwords. Errors appear beside the fields.
- FAQ answers start closed and open or close when their question is clicked.
- A Subscribe button opens a popup. The close button, outside click and Escape close it.
- The background button cycles through four colors.
- The current date and time update every second.

Shared controls are available on the four main pages. The contact password must contain 8-72 characters without whitespace. Forms are local demos: they do not send or save data or create accounts.

The report is available as [PDF](report/REPORT.pdf) and [editable HTML](report/REPORT.html).

## Run locally

Open `index.html` after downloading the project, or run this command in its folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000/. No build or package installation is needed.

## Checks

```bash
node --check site.js
python checks/check_site.py
```

The static checker checks local files, anchors, labels, IDs, image alternatives and footer credits. Browser checks covered the five pages at widths of 320, 390, 768, 992 and 1440 pixels in Chromium. Firefox and Safari have not been checked.

## Hosting and assets

GitHub Pages is configured to serve the root of `main`. Keep `.nojekyll` in the project root.

Cover images belong to their rightsholders; sources are listed in `assets/covers/sources.json`. Bootstrap license notes are in `assets/vendor/bootstrap/`. This is an unofficial educational fan project.
