// Search, suggestions and highlighting share the existing release catalogue.
function initializeArchiveSearch($) {
    const $root = $('#archiveExplorer');
    if (!$root.length || $root.attr('data-search-ready') === 'true') return;

    const $input = $('#archiveSearch');
    const $suggestions = $('#archiveSuggestions');
    const $results = $('#archiveResults');
    const $count = $('#archiveResultCount');
    const $empty = $('#archiveEmpty');
    const $yearFilter = $('#archiveYearFilter');
    const $clear = $('#clearArchiveSearch');
    let activeYear = 'all';
    let activeSuggestion = -1;
    let suggestions = [];

    function getQuery() {
        return String($input.val()).trim().slice(0, 100);
    }

    function normalize(text) {
        return text.toLocaleLowerCase('ru-RU');
    }

    // Text nodes and .text() keep symbols such as < and [ literal and harmless.
    function highlightText(element, query) {
        const $element = $(element);
        let original = $element.data('originalText');
        if (original === undefined) {
            original = $element.text();
            $element.data('originalText', original);
        }
        $element.empty();
        if (!query) {
            $element.text(original);
            return;
        }

        const lowerText = normalize(original);
        const lowerQuery = normalize(query);
        let position = 0;
        let match = lowerText.indexOf(lowerQuery);
        while (match !== -1) {
            $element.append(document.createTextNode(original.slice(position, match)));
            $element.append($('<mark>', { class: 'archive-match' }).text(
                original.slice(match, match + query.length)
            ));
            position = match + query.length;
            match = lowerText.indexOf(lowerQuery, position);
        }
        $element.append(document.createTextNode(original.slice(position)));
    }

    function createCards() {
        const fragment = document.createDocumentFragment();
        musicLibrary.catalogue.forEach((release) => {
            const description = `Релиз ${release.year} года в архиве Cold Carti. Открой обложку в студии и собери свою подборку.`;
            const $card = $('<article>', { class: 'archive-release' })
                .attr('data-release-id', release.id)
                .data('year', String(release.year))
                .data('searchText', normalize(`${release.title} ${description}`));
            const $image = $('<img>', {
                class: 'archive-cover',
                src: 'assets/covers/cover-placeholder.svg',
                alt: `Обложка Cold Carti — ${release.title}`,
                width: 600,
                height: 600,
                decoding: 'async'
            }).attr('data-src', release.cover);
            const $body = $('<div>', { class: 'archive-card-body' });
            const $year = $('<p>', { class: 'archive-card-year eyebrow' }).text(release.year);
            const $title = $('<h3>', { class: 'archive-card-title h5' })
                .attr('data-search-highlight', '')
                .text(release.title);
            const $description = $('<p>', { class: 'archive-card-description small text-body-secondary' })
                .attr('data-search-highlight', '')
                .text(description);
            const $actions = $('<div>', { class: 'archive-card-actions' });
            const $open = $('<a>', { class: 'btn btn-primary', href: 'studio.html#catalogue' })
                .text('В студию');
            const $copy = $('<button>', {
                type: 'button',
                class: 'btn btn-outline-light archive-copy'
            }).attr({
                'data-copy-text': release.title,
                'aria-label': `Скопировать название: ${release.title}`
            });
            $copy.append($('<span>', { 'data-copy-icon': '', 'aria-hidden': 'true' }).text('⧉'));
            $copy.append(document.createTextNode(' Копировать'));
            $actions.append($open, $copy);
            $body.append($year, $title, $description, $actions);
            $card.append($image, $body);
            fragment.append($card[0]);
        });
        $results.empty().append(fragment);
    }

    function closeSuggestions() {
        activeSuggestion = -1;
        $suggestions.prop('hidden', true);
        $suggestions.children().removeClass('is-active').attr('aria-selected', 'false');
        $input.attr('aria-expanded', 'false').removeAttr('aria-activedescendant');
    }

    function updateSuggestions(query) {
        closeSuggestions();
        $suggestions.empty();
        suggestions = [];
        if (!query) return;

        suggestions = musicLibrary.filterByYear(activeYear)
            .filter((release) => normalize(release.title).includes(normalize(query)))
            .slice(0, 5);
        suggestions.forEach((release, index) => {
            const $option = $('<li>', {
                class: 'archive-suggestion',
                role: 'option',
                id: `archive-suggestion-${index}`,
                'aria-selected': 'false'
            }).attr('data-suggestion-index', index);
            $option.append($('<span>').text(release.title));
            $option.append($('<small>', { class: 'text-body-secondary' }).text(release.year));
            $suggestions.append($option);
        });
        if (suggestions.length) {
            $suggestions.prop('hidden', false);
            $input.attr('aria-expanded', 'true');
        }
    }

    function filterReleases(showSuggestions = true) {
        const query = getQuery();
        const lowerQuery = normalize(query);
        const $cards = $results.children('.archive-release');
        const $matches = $cards.filter(function matchesSearch() {
            const $card = $(this);
            const yearMatches = activeYear === 'all' || $card.data('year') === activeYear;
            return yearMatches && $card.data('searchText').includes(lowerQuery);
        });
        $cards.prop('hidden', true);
        $matches.prop('hidden', false);
        $count.text(`Найдено: ${$matches.length} из ${musicLibrary.catalogue.length}`);
        $empty.prop('hidden', $matches.length !== 0);
        $clear.prop('disabled', !String($input.val()).length);
        $('[data-search-highlight]').each(function updateHighlight() {
            highlightText(this, query);
        });
        if (showSuggestions) updateSuggestions(query);
        else closeSuggestions();
        $(document).trigger('archive:updated');
    }

    function chooseSuggestion(index) {
        const release = suggestions[index];
        if (!release) return;
        $input.val(release.title);
        $input.trigger('focus');
        filterReleases(false);
        $(document).trigger('archive:notify', [`Выбран релиз «${release.title}».`]);
    }

    $input.on('input', function handleSearchInput() {
        filterReleases();
    });
    $input.on('focus', function showCurrentSuggestions() {
        updateSuggestions(getQuery());
    });
    $input.on('keydown', function navigateSuggestions(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeSuggestions();
            return;
        }
        if (event.key === 'Tab') {
            closeSuggestions();
            return;
        }
        if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
        if (event.key === 'Enter') {
            if (!$suggestions.prop('hidden') && activeSuggestion >= 0) {
                event.preventDefault();
                chooseSuggestion(activeSuggestion);
            }
            return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        if ($suggestions.prop('hidden')) updateSuggestions(getQuery());
        if (!suggestions.length) return;
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        if (activeSuggestion === -1) {
            activeSuggestion = direction === 1 ? 0 : suggestions.length - 1;
        } else {
            activeSuggestion = (activeSuggestion + direction + suggestions.length) % suggestions.length;
        }
        $suggestions.children().each(function selectActiveSuggestion(index) {
            $(this).toggleClass('is-active', index === activeSuggestion)
                .attr('aria-selected', String(index === activeSuggestion));
        });
        $input.attr('aria-activedescendant', `archive-suggestion-${activeSuggestion}`);
        const option = $suggestions.children()[activeSuggestion];
        const optionTop = option.offsetTop;
        const optionBottom = optionTop + $(option).outerHeight();
        const visibleTop = $suggestions.scrollTop();
        const listHeight = $suggestions.innerHeight();
        if (optionTop < visibleTop) {
            $suggestions.scrollTop(optionTop);
        } else if (optionBottom > visibleTop + listHeight) {
            $suggestions.scrollTop(optionBottom - listHeight);
        }
    });
    // Keep focus in the input until the clicked option has been selected.
    $suggestions.on('mousedown', '[data-suggestion-index]', (event) => event.preventDefault());
    $suggestions.on('click', '[data-suggestion-index]', function selectClickedSuggestion() {
        chooseSuggestion(Number($(this).attr('data-suggestion-index')));
    });
    $(document).on('pointerdown focusin', function closeOutsideSuggestions(event) {
        if (event.target !== $input[0] && !$suggestions[0].contains(event.target)) {
            closeSuggestions();
        }
    });
    $yearFilter.on('click', '[data-archive-year]', function changeYear() {
        activeYear = $(this).attr('data-archive-year');
        $yearFilter.find('[data-archive-year]').attr('aria-pressed', 'false');
        $(this).attr('aria-pressed', 'true');
        filterReleases(false);
        $(document).trigger('archive:notify', [
            activeYear === 'all' ? 'Показаны все годы архива.' : `Выбран ${activeYear} год.`
        ]);
    });
    $clear.on('click', function clearSearch() {
        $input.val('');
        filterReleases(false);
        $input.trigger('focus');
        $(document).trigger('archive:notify', ['Поисковый запрос очищен.']);
    });

    createCards();
    filterReleases(false);
    $root.attr('data-search-ready', 'true');
}
