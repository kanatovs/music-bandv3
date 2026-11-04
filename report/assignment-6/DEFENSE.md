# Assignment 6 - Code Walkthrough

**Team:** Music Band

**Members:** Kanatov Sabyrzhan and Zhaxylyk Alikhan

**Group:** SE-2501

Open `explore.html` beside the source files. Explain each feature by following the same path: an event happens, a function runs, then the page changes.

## Files to open

| File | Purpose |
| --- | --- |
| `explore.html` | Search controls, counters, reading bar, sharing and a demo signup form |
| `explore.css` | Search layout and selected states |
| `archive-search.js` | Live filtering, autocomplete and highlighted matches |
| `script.js` | jQuery setup, progress, counters, loading states, toasts, copying and lazy images |
| `site.js` | Existing shared form validation, including the email rules |
| `music-library.js` | The existing array of nine release objects |

## Task 0 - Start jQuery

The HTML loads jQuery 4.0.0 from its CDN in the head. `script.js` calls `initializeArchiveFeatures($)`, which uses `$(document).ready()` and prints `jQuery is ready!` in the console. The controls are selected after the document is ready.

If the CDN is unavailable, the script loads the same version from `assets/vendor/jquery/` and then starts the features. Normal scripts use `defer` and keep their HTML loading order.

## Task 1 - Filter while typing

`initializeArchiveSearch($)` finds the controls. The search input uses `.on('input', ...)`, so typing, pasting and deleting update the results.

`getQuery()` reads `.val()`, trims outside spaces and limits the query to 100 characters. `normalize()` changes text to lower case. `filterReleases()` uses jQuery `.filter()` to keep cards whose year and search text both match. `.prop('hidden', ...)` changes their visibility, while `.text()` updates the result count. The original catalogue is not changed.

## Task 2 - Suggest titles

`updateSuggestions(query)` finds matching titles for the chosen year and shows up to five options. `chooseSuggestion(index)` puts a selected title into the input with `.val()` and filters the cards.

Arrow Up and Down change `activeSuggestion`; Enter chooses it and Escape closes the list. `aria-expanded`, `aria-selected` and `aria-activedescendant` describe its state. Clicking outside also closes it.

## Task 3 - Highlight matches

`highlightText(element, query)` keeps the original text and finds each literal occurrence with `indexOf()`. It builds text nodes and `<mark>` elements, then inserts them with `.append()`. All marked title, description and archive-note paragraphs are updated. Clearing the query restores the original text.

The query is never inserted as HTML or used as a regular expression. Symbols such as `<` or `[` remain ordinary text instead of creating markup or breaking a pattern.

## Task 4 - Show reading progress

`updateReadingProgress()` calculates:

```text
progress = scroll position / (document height - window height) * 100
```

The value stays between 0 and 100. `.css()` changes the bar's `scaleX()` transform and `.attr()` updates `aria-valuenow`. If the whole page fits in the window, progress is 100. Scroll, resize and changed search results all refresh it.

## Task 5 - Animate numbers

`animateVisibleCounters()` reads each `data-count-to` value. A jQuery `.animate()` call changes a temporary object's number from zero to its target. The `step` callback writes the current whole number with `.text()`; `complete` writes the exact final value.

The counters describe the archive: nine releases, four years and a five-star rating scale. A `counted` flag prevents repeated animation. Reduced-motion preferences show the final number immediately.

## Task 6 - Show a loading state

`site.js` checks the form first. Only a valid final submission dispatches the `form:validated` event with a `completeSubmission` callback.

The jQuery handler prevents immediate completion, saves the button states, disables the form's buttons with `.prop('disabled', true)` and displays a spinner with waiting text. After 1600 milliseconds, `restoreSubmitButton()` restores the controls and the saved callback shows the local result.

Editing a field, resetting the form or closing its dialog cancels the pending result. Invalid input does not start a spinner. The existing `isValidEmail()` rules still reject commas, repeated dots, multiple `@` signs and malformed domains. This practical ASCII check accepts addresses such as `listener+tag@example.com`; it does not verify that a mailbox exists.

## Task 7 - Show a temporary notification

`showToast(message)` changes the notification text, fades it in, waits and calls `.fadeOut()`. `.stop(true, true)` and `clearTimeout()` stop old notifications from building up a queue. Search choices, year changes, copying and completed form checks can show a toast.

## Task 8 - Copy text

A delegated `.on('click', '[data-copy-text]', ...)` handler reads the button's text attribute and awaits `navigator.clipboard.writeText(text)`. Only a successful write changes the icon to a checkmark and shows a tooltip. A timer restores the original icon.

Clipboard access needs a suitable browser context such as HTTPS or localhost. If it is unavailable or denied, `catch` shows a manual-copy message and `finally` enables the button again.

## Task 9 - Load covers when reached

Cards start with a small local placeholder; the real path is in `data-src`. `loadVisibleImages()` uses `.offset()` and the window scroll position to check whether a visible image overlaps the viewport. It then assigns `.attr('src', source)` and removes `data-src`, so that cover is not loaded again on every scroll.

`updateViewport()` runs the progress, counter and image checks together. The search code triggers `archive:updated` after filtering because hidden or newly shown cards change the layout.

## Questions to practise

1. **What is jQuery?** A JavaScript library. `$()` selects or wraps elements so methods such as `.on()` and `.text()` can be used.
2. **What is the difference between `.val()` and `.text()`?** `.val()` reads or sets a form control's value. `.text()` reads or sets the text content of an element.
3. **Why use the input event?** It handles content changes from typing, pasting and deleting. A keyboard-only event would miss some of these changes.
4. **How are autocomplete options selected?** An index tracks the active option. Mouse clicks or Enter pass that index to `chooseSuggestion()`.
5. **Why avoid `.html(query)`?** Search text must be displayed literally. Treating it as HTML could create unwanted markup or unsafe content.
6. **Why subtract the window height in the progress formula?** The bottom of the page is reached before the scroll position equals the full document height.
7. **What is a callback in the counter?** `step` is a function passed to `.animate()` and called during the animation to update the displayed number.
8. **Why validate before showing a spinner?** An invalid form must display errors instead of suggesting that a successful operation has started.
9. **Why clear the old toast timer?** A previous notification must not hide a newer notification too early.
10. **Why await the clipboard write?** It can succeed or fail later. Success feedback should appear only when copying has succeeded.
11. **Why keep the real image path in data-src?** A normal `src` would let the browser request the real cover immediately. The script controls when that path becomes `src`.
12. **Are forms actually submitted to a server?** No. The delay simulates waiting. The project validates locally and does not save data, send email or create accounts. A real server would need its own validation.

## Five small exercises

- Change the counter duration in `animateVisibleCounters()` from 900 to 1500 milliseconds and watch one fresh page load.
- Change the maximum number of suggestions in `updateSuggestions()` from five to three and try a query with several matches.
- Change a highlighted-match color in CSS, search for a repeated word and then clear the input.
- Change the form delay from 1600 to 2500 milliseconds. Try an invalid email, a valid submission and editing while waiting; explain each result.
- Find the clipboard handler and explain why the icon update is after `await`, while re-enabling the button is in `finally`.

For practice, use made-up names, addresses and passwords. Run the checks listed in README.md after changing the code; manually check keyboard navigation, clipboard feedback, loading states and scroll behavior in the browser.
