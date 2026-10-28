// Studio controls use the objects and methods defined in music-library.js.
function initializeStudio(root) {
    const collection = musicLibrary.createCollection();
    const grid = document.getElementById('releaseGrid');
    const template = document.getElementById('releaseCardTemplate');
    const filter = document.getElementById('studioFilter');
    const search = document.getElementById('studioSearch');
    const count = document.getElementById('studioCount');
    const cover = document.getElementById('selectedCover');
    const title = document.getElementById('selectedTitle');
    const year = document.getElementById('selectedYear');
    const thumbnails = document.getElementById('coverThumbs');
    const stars = document.getElementById('ratingStars');
    const ratingStatus = document.getElementById('ratingStatus');
    const selectedAdd = document.getElementById('selectedAdd');
    const collectionList = document.getElementById('collectionList');
    const collectionCount = document.getElementById('collectionCount');
    const collectionEmpty = document.getElementById('collectionEmpty');
    const collectionStatus = document.getElementById('collectionStatus');
    const soundButton = document.getElementById('studioSound');
    const audio = document.getElementById('archiveChime');
    const soundStatus = document.getElementById('soundStatus');
    const filterButtons = filter.querySelectorAll('button[data-studio-year]');
    const ratingButtons = stars.querySelectorAll('button[data-rating]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let selectedId = musicLibrary.catalogue[0].id;
    let activeYear = 'all';
    let coverAnimation = null;
    let soundRequest = 0;

    function updateAddButtons() {
        const selectedIsAdded = collection.items.includes(selectedId);
        selectedAdd.disabled = selectedIsAdded;
        selectedAdd.textContent = selectedIsAdded ? 'Уже в подборке' : 'Добавить в подборку';
        grid.querySelectorAll('[data-add-release]').forEach((button) => {
            const isAdded = collection.items.includes(button.dataset.addRelease);
            button.disabled = isAdded;
            button.textContent = isAdded ? 'Добавлено' : 'В подборку';
        });
    }

    function renderRating() {
        const rating = collection.getRating(selectedId);
        ratingButtons.forEach((button) => {
            const value = Number(button.dataset.rating);
            button.classList.toggle('is-filled', value <= rating);
            button.setAttribute('aria-pressed', String(value === rating));
            button.disabled = false;
        });
        ratingStatus.textContent = rating
            ? `Твоя оценка: ${rating} из 5. Она действует до перезагрузки страницы.`
            : 'Выбери оценку от 1 до 5. Она действует до перезагрузки страницы.';
    }

    function updateSelectedStyles() {
        thumbnails.querySelectorAll('[data-select-release]').forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.selectRelease === selectedId));
        });
        grid.querySelectorAll('[data-release-id]').forEach((card) => {
            card.classList.toggle('is-selected', card.dataset.releaseId === selectedId);
        });
    }

    function selectRelease(id, animate = true) {
        const release = musicLibrary.getById(id);
        if (!release) return;
        selectedId = release.id;
        cover.src = release.cover;
        cover.alt = `Обложка Cold Carti — ${release.title}`;
        title.textContent = release.title;
        year.textContent = `Cold Carti / ${release.year}`;
        updateSelectedStyles();
        renderRating();
        updateAddButtons();

        if (coverAnimation) coverAnimation.cancel();
        if (animate && !reducedMotion.matches && typeof cover.animate === 'function') {
            coverAnimation = cover.animate([
                { transform: 'scale(.96)', opacity: 0.5 },
                { transform: 'scale(1)', opacity: 1 }
            ], { duration: 220, easing: 'ease-out' });
        }
    }

    function renderReleases() {
        const query = search.value.trim().toLocaleLowerCase('ru-RU');
        const releases = musicLibrary.filterByYear(activeYear)
            .filter((release) => release.title.toLocaleLowerCase('ru-RU').includes(query));
        const fragment = document.createDocumentFragment();

        for (const release of releases) {
            const card = template.content.firstElementChild.cloneNode(true);
            card.dataset.releaseId = release.id;
            const image = card.querySelector('[data-card-cover]');
            image.src = release.cover;
            image.alt = `Обложка Cold Carti — ${release.title}`;
            card.querySelector('[data-card-year]').textContent = String(release.year);
            card.querySelector('[data-card-title]').textContent = release.title;
            const previewButton = card.querySelector('[data-preview-release]');
            previewButton.dataset.previewRelease = release.id;
            previewButton.setAttribute('aria-label', `Открыть релиз: ${release.title}`);
            const addButton = card.querySelector('[data-add-release]');
            addButton.dataset.addRelease = release.id;
            addButton.setAttribute('aria-label', `Добавить в подборку: ${release.title}`);
            fragment.append(card);
        }

        grid.replaceChildren(fragment);
        count.textContent = releases.length
            ? `Показано: ${releases.length} из ${musicLibrary.catalogue.length}`
            : 'Ничего не найдено. Измени год или поисковый запрос.';
        updateSelectedStyles();
        updateAddButtons();
    }

    function renderThumbnails() {
        const fragment = document.createDocumentFragment();
        for (const release of musicLibrary.catalogue) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'cover-thumb';
            button.dataset.selectRelease = release.id;
            button.setAttribute('aria-label', `Показать обложку: ${release.title}`);
            const image = document.createElement('img');
            image.src = release.cover;
            image.alt = '';
            image.width = 80;
            image.height = 80;
            image.loading = 'lazy';
            const label = document.createElement('span');
            label.className = 'visually-hidden';
            label.textContent = release.title;
            button.append(image, label);
            fragment.append(button);
        }
        thumbnails.replaceChildren(fragment);
    }

    function renderCollection(addedId = null) {
        const fragment = document.createDocumentFragment();
        for (const id of collection.items) {
            const release = musicLibrary.getById(id);
            const item = document.createElement('li');
            item.className = 'collection-item';
            item.classList.toggle('is-added', id === addedId);
            const label = document.createElement('span');
            label.textContent = release.title;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-outline-light btn-sm';
            button.dataset.removeRelease = release.id;
            button.setAttribute('aria-label', `Убрать из подборки: ${release.title}`);
            button.textContent = 'Убрать';
            item.append(label, button);
            fragment.append(item);
        }
        collectionList.replaceChildren(fragment);
        collectionCount.textContent = String(collection.count());
        collectionEmpty.hidden = collection.count() > 0;
        collectionList.hidden = collection.count() === 0;
        updateAddButtons();
    }

    function addRelease(id) {
        const release = musicLibrary.getById(id);
        if (!release) return;
        if (!collection.add(id)) {
            collectionStatus.textContent = 'Этот релиз уже есть в твоей подборке.';
            return;
        }
        renderCollection(id);
        collectionStatus.textContent = `Добавлен релиз «${release.title}». В подборке: ${collection.count()}.`;
    }

    filter.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-studio-year]');
        if (!button || !filter.contains(button)) return;
        activeYear = button.dataset.studioYear;
        filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        renderReleases();
    });
    search.addEventListener('input', renderReleases);
    thumbnails.addEventListener('click', (event) => {
        const button = event.target.closest('[data-select-release]');
        if (button && thumbnails.contains(button)) selectRelease(button.dataset.selectRelease);
    });
    grid.addEventListener('click', (event) => {
        const previewButton = event.target.closest('[data-preview-release]');
        if (previewButton && grid.contains(previewButton)) {
            selectRelease(previewButton.dataset.previewRelease);
            document.getElementById('listen').scrollIntoView({
                behavior: reducedMotion.matches ? 'auto' : 'smooth'
            });
            title.focus({ preventScroll: true });
            return;
        }
        const addButton = event.target.closest('[data-add-release]');
        if (addButton && grid.contains(addButton)) addRelease(addButton.dataset.addRelease);
    });
    ratingButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (collection.setRating(selectedId, Number(button.dataset.rating))) renderRating();
        });
    });
    selectedAdd.addEventListener('click', () => addRelease(selectedId));
    collectionList.addEventListener('click', (event) => {
        const button = event.target.closest('[data-remove-release]');
        if (!button || !collectionList.contains(button)) return;
        const id = button.dataset.removeRelease;
        const release = musicLibrary.getById(id);
        const previousIndex = Array.from(collectionList.querySelectorAll('button')).indexOf(button);
        if (!collection.remove(id)) return;
        renderCollection();
        collectionStatus.textContent = `Релиз «${release.title}» убран из подборки.`;
        const remainingButtons = collectionList.querySelectorAll('button');
        const nextFocus = remainingButtons[Math.min(previousIndex, remainingButtons.length - 1)] || selectedAdd;
        nextFocus.focus();
    });

    // One audio element is reused, so repeated clicks cannot create overlapping players.
    audio.volume = 0.3;
    soundButton.disabled = false;
    soundButton.addEventListener('click', async () => {
        const request = ++soundRequest;
        try {
            audio.pause();
            audio.currentTime = 0;
            await audio.play();
            if (request === soundRequest) soundStatus.textContent = 'Играет короткий сигнал интерфейса.';
        } catch (error) {
            if (request !== soundRequest) return;
            soundStatus.textContent = 'Не удалось включить звук. Проверь настройки звука браузера и попробуй ещё раз.';
        }
    });
    audio.addEventListener('ended', () => {
        if (audio.ended) soundStatus.textContent = 'Сигнал проигран. Нажми кнопку, чтобы услышать его снова.';
    });

    filterButtons.forEach((button) => { button.disabled = false; });
    search.disabled = false;
    renderThumbnails();
    renderReleases();
    renderCollection();
    selectRelease(selectedId, false);
    root.dataset.ready = 'true';
}

const studioRoot = document.querySelector('#listeningStudio');
if (studioRoot) initializeStudio(studioRoot);
