# Assignment 5 - Code Walkthrough

**Team:** Music Band

**Members:** Kanatov Sabyrzhan and Zhaxylyk Alikhan

**Group:** SE-2501

Open the site beside the source files and follow these seven topics.

## 1. Selecting elements and changing the page

`studio.html` contains the controls and an HTML card template. In `studio.js`, `getElementById()` finds individual elements and `querySelectorAll()` finds groups of filter or rating buttons.

Clicking a thumbnail calls `selectRelease(id)`. It finds the release, changes the large image's `src` and `alt`, and writes the title and year with `textContent`. `renderRating()` reads that release's rating and changes the stars' classes. The selected rating is also written as text.

Show: select two different covers, then rate one of them. Each release keeps its own rating until reload.

## 2. Clicks, keyboard events and switch

Button actions use `addEventListener('click', ...)`. The search field uses the `input` event, so the result changes while the visitor types.

In `site.js`, `handleMenuKeydown()` listens for navigation keys while a menu link has focus. A `switch` chooses the next index: Right/Down move forward, Left/Up move back, Home selects the first link and End selects the last. Only visible links participate. Tab still works normally.

`musicLibrary.filterByYear()` uses another `switch` to accept a supported year or all years. An unsupported year returns an empty array.

## 3. A callback in the contact form

`currentStep` stores the visible form step. `goToStep(index, onStepChange)` updates it and calls the function passed as `onStepChange`. In normal use, that function is `renderFormStep`.

Next validates the current step before moving forward. Back changes the step without deleting values. The fields stay in the document; changing their `hidden` property does not clear `.value`.

On final submission, all required fields are checked. If an error belongs to another step, that step is shown before the field receives focus. A successful check displays a demo message and clears password fields. Nothing is sent to a server.

Both forms use `isValidEmail()`. It checks for exactly one `@`, allowed characters, valid domain labels and correct dot placement. Commas, internal spaces, repeated dots and malformed domains are rejected. A valid address such as `listener+tag@example.com` is accepted. This checks the format, not whether a mailbox exists.

## 4. Objects, arrays and collection methods

`music-library.js` contains the `musicLibrary` object. Its `catalogue` array holds release objects with `id`, `title`, `year` and `cover` properties.

`createCollection()` returns an object with `add()`, `remove()`, `count()`, `setRating()` and `getRating()` methods. Unknown releases and duplicate additions are rejected. Ratings must be whole numbers from 1 to 5. Methods return a result so the interface can display the correct message.

The `items` getter returns a copy of the selected IDs. Reading it cannot accidentally modify the internal array. The collection and ratings are kept in memory, so reloading starts a new session.

## 5. Loops and higher-order functions

`renderReleases()` gets releases for the selected year and calls `.filter()` with a search function. `filter()` is a higher-order function because it receives another function as an argument.

A `for...of` loop builds one card for each result. Each card is cloned from the HTML template, filled with release data and added to a document fragment. `replaceChildren()` replaces the previous results without reloading the page. User text is not inserted as HTML.

## 6. Sound and animation

`archiveChime` is one audio element with a local WAV file. Its click handler pauses it, sets `currentTime` to zero and calls `play()`. Reusing one player prevents several sounds from overlapping. `try/catch` handles playback failure; the request number stops an older request from replacing newer feedback.

When a cover is selected, `cover.animate()` briefly changes its scale and opacity. The previous cover animation is cancelled before starting another. A newly added collection item receives the `is-added` class. JavaScript and CSS respect the visitor's reduced-motion setting.

## 7. Structure and checks

- HTML: page structure, labels and card template.
- CSS: layout, selected states and animations.
- `music-library.js`: release data and collection rules.
- `studio.js`: Studio interactions and rendering.
- `site.js`: shared controls, form steps and keyboard navigation.

Scripts use `defer`, so the HTML has been parsed before they select its elements. The shared script checks whether a component exists before using it.

Run the commands listed in README.md after a change. Five model tests check data rules and nine email tests check valid and invalid formats. The Python checker checks the static pages. Browser checks are still needed for focus, layout, sound and visible behavior.

## Questions to practise

1. **What is a callback?** A function passed to another function to be called later. Here, `renderFormStep` is passed to `goToStep`.
2. **Why use a switch?** It gives named branches for the supported keys or filter values.
3. **What is the difference between an object and an array?** An object groups named properties or methods; an array stores an ordered collection.
4. **Why use textContent?** It changes plain text without interpreting the value as HTML.
5. **Why does Back keep the entered name?** The field is hidden, not replaced or reset.
6. **Does client validation protect a real server?** No. A production server must validate submitted data too.
7. **Why can the sound fail?** Browser playback settings or an unavailable audio file can block it; the handler displays feedback instead of leaving an unhandled error.

## Small exercises

- Change the cover-animation duration from 220 to 400 milliseconds.
- Change the empty-search message and test a query that finds no releases.
- Add a release object with a unique ID and a valid local cover, then check its card and thumbnail.
- Explain why `collection.add(id)` returns `false` for an existing ID.
- Walk through Next, Back and Reset with made-up form values.

Only use test values and a made-up password during the demonstration.
