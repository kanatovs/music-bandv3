// The fixed MusicBrainz artist ID keeps the online discography tied to Cold Carti.
const musicBrainzArtistId = 'cf769625-2df8-4a4a-bb09-07c992dc9a45';

function normalizeMusicReleases(payload) {
    if (!payload || !Array.isArray(payload['release-groups'])) {
        throw new Error('Unexpected discography response');
    }

    const releases = [];
    const seen = new Set();
    for (const release of payload['release-groups']) {
        if (!release || typeof release.id !== 'string' ||
            !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(release.id) ||
            typeof release.title !== 'string' || !release.title.trim() ||
            release.title.length > 200 || seen.has(release.id)) continue;

        const date = release['first-release-date'];
        const type = release['primary-type'];
        releases.push({
            id: release.id,
            title: release.title.trim(),
            'first-release-date': typeof date === 'string' && /^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(date) ? date : '',
            'primary-type': typeof type === 'string' && type.length <= 40 ? type : ''
        });
        seen.add(release.id);
    }
    if (payload['release-groups'].length && !releases.length) {
        throw new Error('The discography has no usable records');
    }
    releases.sort((first, second) => second['first-release-date'].localeCompare(first['first-release-date']));
    return releases.slice(0, 9);
}

function initializeMusicApi() {
    const section = document.querySelector('[data-music-api]');
    if (!section) return;
    const button = section.querySelector('[data-api-load]');
    const status = section.querySelector('[data-api-status]');
    const results = section.querySelector('[data-api-results]');
    const cacheKey = 'music-band-discography-v1';
    const cacheLifetime = 60 * 60 * 1000;
    const releaseTypes = { Album: 'Альбом', EP: 'EP', Single: 'Сингл', Broadcast: 'Эфир', Other: 'Релиз' };
    let loading = false;
    let lastRequestAt = 0;

    function showReleases(releases, cached) {
        const list = document.createElement('ul');
        list.className = 'online-release-list';
        releases.forEach((release) => {
            const item = document.createElement('li');
            item.className = 'online-release';
            const copy = document.createElement('div');
            copy.className = 'online-release-copy';
            const type = document.createElement('span');
            type.className = 'online-release-type';
            type.textContent = releaseTypes[release['primary-type']] || 'Релиз';
            const title = document.createElement('h3');
            const link = document.createElement('a');
            link.href = 'https://musicbrainz.org/release-group/' + release.id;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = release.title;
            link.setAttribute('aria-label', release.title + ' — открыть в MusicBrainz');
            title.append(link);
            copy.append(type, title);
            const date = document.createElement('time');
            date.className = 'online-release-date';
            date.textContent = release['first-release-date'] || 'Дата не указана';
            if (release['first-release-date']) date.dateTime = release['first-release-date'];
            item.append(copy, date);
            list.append(item);
        });
        results.replaceChildren(list);
        status.dataset.state = 'success';
        if (!releases.length) {
            status.textContent = cached
                ? 'В сохранённом ответе MusicBrainz пока нет релизов.'
                : 'MusicBrainz пока не вернул релизы этого исполнителя.';
        } else {
            status.textContent = cached
                ? `Показаны релизы из MusicBrainz. Использована сохранённая копия, полученная менее часа назад. Найдено: ${releases.length}.`
                : `Дискография Cold Carti загружена из MusicBrainz. Показано релизов: ${releases.length}.`;
        }
        button.textContent = 'Показать дискографию';
        document.dispatchEvent(new CustomEvent('archive:updated'));
    }

    function readCache() {
        try {
            const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
            if (!cached || cached.artistId !== musicBrainzArtistId ||
                !Number.isFinite(cached.savedAt) || cached.savedAt > Date.now() ||
                Date.now() - cached.savedAt >= cacheLifetime) return null;
            return normalizeMusicReleases(cached.payload);
        } catch {
            return null;
        }
    }

    async function loadReleases() {
        if (loading) return;
        const cached = readCache();
        if (cached) {
            showReleases(cached, true);
            return;
        }
        if (Date.now() - lastRequestAt < 1000) return;

        loading = true;
        lastRequestAt = Date.now();
        button.disabled = true;
        button.textContent = 'Загружаем…';
        section.setAttribute('aria-busy', 'true');
        status.dataset.state = 'loading';
        status.textContent = 'Загружаем дискографию Cold Carti…';
        results.replaceChildren();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const params = new URLSearchParams({ artist: musicBrainzArtistId, fmt: 'json', limit: '100' });
            const response = await fetch('https://musicbrainz.org/ws/2/release-group?' + params, {
                signal: controller.signal,
                headers: { Accept: 'application/json' }
            });
            if (!response.ok) throw new Error('MusicBrainz response: ' + response.status);
            const releases = normalizeMusicReleases(await response.json());
            showReleases(releases, false);
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    artistId: musicBrainzArtistId,
                    savedAt: Date.now(),
                    payload: { 'release-groups': releases }
                }));
            } catch {
                // The current response remains usable when local storage is unavailable.
            }
        } catch (error) {
            status.dataset.state = 'error';
            status.textContent = error.name === 'AbortError'
                ? 'MusicBrainz отвечает слишком долго. Попробуй загрузить дискографию ещё раз.'
                : 'Не удалось загрузить дискографию. Проверь подключение и попробуй ещё раз.';
            button.textContent = 'Повторить загрузку';
        } finally {
            clearTimeout(timeout);
            loading = false;
            button.disabled = false;
            section.removeAttribute('aria-busy');
        }
    }

    button.addEventListener('click', loadReleases);
    button.disabled = false;
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeMusicApi);
    else initializeMusicApi();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { normalizeMusicReleases };
}
