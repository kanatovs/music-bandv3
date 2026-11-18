# Music Band — Cold Carti Fan Archive

A responsive music archive for Cold Carti listeners. The website combines a local release catalogue, a listening collection, a browser-local account and an online discography.

**Team:** Kanatov Sabyrzhan and Zhaxylyk Alikhan, SE-2501.

- [Live website](https://kanatovs.github.io/music-bandv3/)
- [Repository](https://github.com/kanatovs/music-bandv3)

## Run locally

Extract the complete project, open its folder in a terminal and run:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/`. HTTPS and localhost provide the browser APIs used for password verification and clipboard access. The project runs directly from its files with no build or installation step.

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Release highlights, cover carousel and year-filtered gallery |
| `about.html` | Project purpose, team and interactive FAQ |
| `tour.html` | Demonstration concert cards |
| `contact.html` | Two-step contact form with inline validation |
| `studio.html` | Cover selection, ratings and saved listening collection |
| `explore.html` | Search, autocomplete, highlighted matches and MusicBrainz discography |
| `media-queries.html` | Standalone responsive release selection |
| `account.html` | Registration and login forms on one page |
| `profile.html` | Listener details, favorites, ratings and logout |

## Final project features

- All nine connected pages use responsive layouts. The Bootstrap pages combine its grid with custom Flexbox and CSS Grid rules. The standalone page uses its own media queries.
- One Settings panel in the header contains light/dark controls and a background selector. Anthracite and white surfaces use a shared red accent. Both preferences persist across pages in `localStorage`.
- Registration validates name, email, phone, password and confirmation. Login opens the profile after credential verification. Profile details include name, email, phone, favorites and ratings.
- JavaScript validates forms through `data-validation` rules. Forms declare `novalidate`, and errors appear beside their fields. The email checker rejects commas, repeated dots and malformed domains. Phone validation accepts `+7` followed by ten digits with common display separators. Signup passwords require 8–72 characters, upper- and lowercase letters, a digit and punctuation or a symbol, with no whitespace.
- Live archive search combines title/description matching with year filtering. Autocomplete supports mouse and keyboard. Matching text is wrapped in safe `mark` elements.
- jQuery provides the progress bar, animated statistics, submit waiting state, temporary notifications, copy feedback and viewport-based cover loading. Hover and interface effects respect reduced-motion preferences.

## Local account and collection storage

`js/listener-store.js` stores account records and the current user ID in browser-local storage. It derives a password verifier with Web Crypto PBKDF2, SHA-256, a random salt and 100,000 iterations. `js/auth.js` connects those operations to the forms and profile.

This is an educational authentication simulation. Account data belongs to the current browser origin. Localhost and the published website each have their own accounts. The implementation requires trusted server-side authentication for production account protection.

Studio saves favorites and ratings under the current account ID. Visitors have a separate guest collection. Logging in to another account selects that account's collection. The contact and subscription forms provide local validation demonstrations.

## Public music API

`js/music-api.js` requests the [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API) when the discography button is clicked. It uses Cold Carti's fixed artist ID, `cf769625-2df8-4a4a-bb09-07c992dc9a45`, so the response belongs to this performer.

The Explore page shows up to nine returned release groups ordered by date, including release titles, types, dates and links to MusicBrainz. The module validates response data, shows loading/empty/error states, enables retry after failure and aborts requests after ten seconds. Successful results are cached for one hour in `localStorage`. Requests are guarded against repeated clicks.

## Source files

```text
music-band/
├── index.html, about.html, tour.html, contact.html
├── studio.html, explore.html, media-queries.html
├── account.html, profile.html
├── css/             Shared palette, page layouts and component styles
├── js/              Page behavior, validation, account storage and API code
├── assets/          Covers, sound, favicon and local vendor files
├── checks/          Static checks and Node.js tests
└── README.md
```

Important modules are `js/theme.js`, `js/validation.js`, `js/site.js`, `js/listener-store.js`, `js/auth.js`, `js/music-library.js`, `js/studio.js`, `js/archive-search.js`, `js/script.js` and `js/music-api.js`.

jQuery 4.0.0 full loads from its pinned CDN URL with an integrity hash. `js/script.js` loads the local copy in `assets/vendor/jquery/` if the CDN fails. Bootstrap is bundled locally. External discography requests require an internet connection.

## Verification

```sh
python checks/check_site.py
node --test checks/email.test.cjs checks/validation.test.cjs checks/auth.test.cjs checks/studio.test.cjs checks/music-api.test.cjs
```

The static checker verifies all nine pages, local paths and anchors, labels, field-error associations, JavaScript-only form validation and required script connections. Node tests cover email/phone/password rules, account and collection behavior, release operations and API response normalization. Browser checks cover responsive layouts and the visible user flows.

GitHub Pages serves the project root from `main`. Keep `.nojekyll` in the project root. Cover sources are listed in `assets/covers/sources.json`, and vendor licenses remain with the bundled files. Music Band is an unofficial educational fan project.
