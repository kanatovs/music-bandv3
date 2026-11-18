// Account forms and the listener profile use the same browser-local store as Studio.
(function () {
    'use strict';

    const store = window.listenerStore;
    const accountRoot = document.querySelector('[data-account-page]');
    const profileRoot = document.querySelector('[data-profile-page]');
    if (!store || (!accountRoot && !profileRoot)) return;

    function setStatus(node, message, state) {
        node.textContent = message;
        node.dataset.state = state;
    }

    if (accountRoot) {
        const forms = Array.from(accountRoot.querySelectorAll('[data-auth-form]'));
        const tabs = Array.from(accountRoot.querySelectorAll('[data-auth-tab]'));
        const signedIn = document.getElementById('signedInNote');

        function showForm(mode) {
            forms.forEach((form) => { form.hidden = form.dataset.authForm !== mode; });
            tabs.forEach((button) => {
                button.setAttribute('aria-pressed', String(button.dataset.authTab === mode));
            });
        }

        tabs.forEach((button) => button.addEventListener('click', () => {
            showForm(button.dataset.authTab);
        }));
        showForm(location.hash === '#signup' ? 'signup' : 'login');

        try {
            signedIn.hidden = !store.getCurrentUser();
        } catch (error) {
            const status = document.getElementById('accountStorageStatus');
            setStatus(status, error.message, 'error');
        }

        forms.forEach((form) => {
            const status = form.querySelector('[data-auth-status]');
            const button = form.querySelector('button[type="submit"]');
            let busy = false;
            button.disabled = false;
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                if (busy) return;
                const invalid = window.formValidation.validate(form);
                if (invalid.length) {
                    setStatus(status, 'Проверь отмеченные поля.', 'error');
                    invalid[0].focus();
                    return;
                }
                busy = true;
                button.disabled = true;
                const fields = Array.from(form.querySelectorAll('input'));
                fields.forEach((field) => { field.disabled = true; });
                tabs.forEach((tab) => { tab.disabled = true; });
                const originalText = button.textContent;
                button.textContent = 'Подожди…';
                form.setAttribute('aria-busy', 'true');
                setStatus(status, 'Проверяем данные…', 'pending');
                try {
                    const email = form.elements.namedItem('email').value;
                    const password = form.elements.namedItem('password').value;
                    if (form.dataset.authForm === 'signup') {
                        const user = await store.signUp({
                            name: form.elements.namedItem('name').value,
                            phone: form.elements.namedItem('phone').value,
                            email, password
                        });
                        form.reset();
                        const login = forms.find((item) => item.dataset.authForm === 'login');
                        login.elements.namedItem('email').value = user.email;
                        showForm('login');
                        setStatus(login.querySelector('[data-auth-status]'),
                            'Аккаунт создан. Введи пароль, чтобы открыть профиль.', 'success');
                        login.elements.namedItem('password').focus();
                    } else {
                        await store.logIn(email, password);
                        form.elements.namedItem('password').value = '';
                        window.location.assign('profile.html');
                    }
                } catch (error) {
                    setStatus(status, error.message, 'error');
                } finally {
                    busy = false;
                    fields.forEach((field) => { field.disabled = false; });
                    tabs.forEach((tab) => { tab.disabled = false; });
                    button.disabled = false;
                    button.textContent = originalText;
                    form.removeAttribute('aria-busy');
                }
            });
            form.addEventListener('input', (event) => {
                const field = event.target;
                if (field.matches('[data-validation]') && field.getAttribute('aria-invalid') === 'true') {
                    window.formValidation.showError(field, window.formValidation.getError(field, form));
                }
                if (status.dataset.state === 'error') setStatus(status, '', '');
            });
        });
    }

    if (profileRoot) {
        const status = document.getElementById('profileStatus');
        const content = document.getElementById('profileContent');
        const guest = document.getElementById('profileGuest');
        try {
            const user = store.getCurrentUser();
            if (!user) {
                guest.hidden = false;
                return;
            }
            content.hidden = false;
            document.getElementById('profileName').textContent = user.name;
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('profilePhone').textContent = user.phone;
            document.getElementById('profileGreeting').textContent = 'Твой архив, ' + user.name + '.';
            const collection = store.readCollection();
            const favoriteList = document.getElementById('profileFavorites');
            const ratingList = document.getElementById('profileRatings');
            const favorites = musicLibrary.catalogue.filter((release) => collection.items.includes(release.id));
            const rated = musicLibrary.catalogue.filter((release) => collection.ratings[release.id]);
            document.getElementById('favoriteCount').textContent = favorites.length;
            document.getElementById('ratingCount').textContent = rated.length;
            document.getElementById('profileFavoritesEmpty').hidden = favorites.length > 0;
            document.getElementById('profileRatingsEmpty').hidden = rated.length > 0;

            function releaseItem(release, rating) {
                const item = document.createElement('li');
                item.className = 'profile-release';
                const image = document.createElement('img');
                image.src = release.cover;
                image.alt = 'Обложка релиза «' + release.title + '»';
                image.width = 64;
                image.height = 64;
                image.loading = 'lazy';
                const details = document.createElement('div');
                const link = document.createElement('a');
                link.href = 'studio.html';
                link.textContent = release.title;
                const meta = document.createElement('p');
                meta.className = 'small text-body-secondary mb-0';
                meta.textContent = rating ? 'Твоя оценка — ' + rating + ' из 5' : 'Cold Carti / ' + release.year;
                details.append(link, meta);
                item.append(image, details);
                return item;
            }
            favorites.forEach((release) => favoriteList.append(releaseItem(release)));
            rated.forEach((release) => ratingList.append(releaseItem(release, collection.ratings[release.id])));
        } catch (error) {
            setStatus(status, error.message, 'error');
        }
        document.getElementById('logOutButton').addEventListener('click', () => {
            try {
                store.logOut();
                window.location.assign('account.html');
            } catch (error) {
                setStatus(status, error.message, 'error');
            }
        });
    }
})();
