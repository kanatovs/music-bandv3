// Suggested study responsibility: Kanatov Sabyrzhan — validation and popup.
// These forms are local demonstrations: no data is sent or saved.
document.querySelectorAll('form[data-validate]').forEach((form) => {
    const fields = Array.from(form.querySelectorAll('[required]'));
    const status = form.querySelector('[data-form-status]');
    form.noValidate = true;
    form.querySelector('button[type="submit"]').disabled = false;

    function getError(field) {
        const value = field.value;
        const requiredMessages = {
            name: 'Введи имя: поле не должно состоять из пробелов.',
            email: 'Введи email.',
            password: 'Введи пароль.',
            confirmPassword: 'Повтори пароль.',
            message: 'Напиши сообщение: поле не должно состоять из пробелов.'
        };

        if (!value.trim()) return requiredMessages[field.name] || 'Заполни это поле.';
        if (field.name === 'email' && (field.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))) {
            return 'Введи корректный email, например name@example.com.';
        }
        if (field.name === 'password' && (value.length < 8 || value.length > 72 || /\s/.test(value))) {
            return 'Пароль должен содержать от 8 до 72 символов без пробелов.';
        }
        if (field.name === 'confirmPassword' && value !== form.elements.namedItem('password').value) {
            return 'Пароли не совпадают. Повтори пароль точно.';
        }
        if (field.maxLength > 0 && value.length > field.maxLength) {
            return `Используй не больше ${field.maxLength} символов.`;
        }
        return '';
    }

    function showError(field, message) {
        const error = document.getElementById(`${field.id}Error`);
        field.setAttribute('aria-invalid', String(Boolean(message)));
        field.classList.toggle('is-invalid', Boolean(message));
        if (error) {
            error.textContent = message;
            error.hidden = !message;
        }
    }

    function clearStatus() {
        status.textContent = '';
        delete status.dataset.state;
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const invalidFields = [];
        fields.forEach((field) => {
            const message = getError(field);
            showError(field, message);
            if (message) invalidFields.push(field);
        });

        if (invalidFields.length) {
            status.textContent = `Проверь отмеченные поля: ${invalidFields.length}. Данные не отправлены.`;
            status.dataset.state = 'error';
            invalidFields[0].focus();
            return;
        }

        status.textContent = 'Форма заполнена корректно. Это демо: данные не отправлены и не сохранены.';
        status.dataset.state = 'success';
        fields.filter((field) => field.type === 'password').forEach((field) => {
            field.value = '';
        });
    });

    form.addEventListener('input', (event) => {
        const field = event.target;
        clearStatus();
        if (!fields.includes(field)) return;
        if (field.getAttribute('aria-invalid') === 'true') showError(field, getError(field));
        if (field.name === 'password') {
            const confirmation = form.elements.namedItem('confirmPassword');
            if (confirmation && (confirmation.value || confirmation.getAttribute('aria-invalid') === 'true')) {
                showError(confirmation, getError(confirmation));
            }
        }
    });

    form.addEventListener('reset', () => {
        fields.forEach((field) => showError(field, ''));
        clearStatus();
    });
});

const subscribeDialog = document.querySelector('#subscribeDialog');
if (subscribeDialog && typeof subscribeDialog.showModal === 'function') {
    let dialogOpener = null;
    document.querySelectorAll('[data-open-subscribe]').forEach((button) => {
        button.disabled = false;
        button.addEventListener('click', () => {
            dialogOpener = button;
            if (!subscribeDialog.open) subscribeDialog.showModal();
            document.body.classList.add('dialog-open');
        });
    });

    subscribeDialog.querySelectorAll('[data-close-subscribe]').forEach((button) => {
        button.addEventListener('click', () => subscribeDialog.close());
    });

    subscribeDialog.addEventListener('click', (event) => {
        if (event.target !== subscribeDialog) return;
        const bounds = subscribeDialog.getBoundingClientRect();
        const outside = event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom;
        if (outside) subscribeDialog.close();
    });

    // Native dialog behavior also closes the popup when Escape is pressed.
    subscribeDialog.addEventListener('close', () => {
        document.body.classList.remove('dialog-open');
        if (dialogOpener) dialogOpener.focus();
        dialogOpener = null;
    });
}

// Suggested study responsibility: Zhaxylyk Alikhan — FAQ, background and clock.
document.querySelectorAll('[data-accordion-button]').forEach((button) => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    if (!panel) return;

    function setExpanded(expanded) {
        button.setAttribute('aria-expanded', String(expanded));
        panel.setAttribute('aria-hidden', String(!expanded));
        panel.inert = !expanded;
        panel.classList.toggle('is-open', expanded);
    }

    setExpanded(false);
    button.disabled = false;
    button.addEventListener('click', () => {
        setExpanded(button.getAttribute('aria-expanded') !== 'true');
    });
});

const backgroundButton = document.querySelector('[data-change-background]');
if (backgroundButton) {
    const backgrounds = [
        { color: '#090909', name: 'Ночной' },
        { color: '#101b17', name: 'Лесной' },
        { color: '#171329', name: 'Фиолетовый' },
        { color: '#1e1620', name: 'Вишнёвый' }
    ];
    let backgroundIndex = 0;
    const label = document.querySelector('[data-background-label]');
    const status = document.querySelector('[data-background-status]');
    if (label) label.textContent = backgrounds[backgroundIndex].name;
    backgroundButton.disabled = false;
    backgroundButton.addEventListener('click', () => {
        backgroundIndex = (backgroundIndex + 1) % backgrounds.length;
        const background = backgrounds[backgroundIndex];
        document.body.style.backgroundColor = background.color;
        document.body.style.setProperty('--page-bg', background.color);
        if (label) label.textContent = background.name;
        if (status) status.textContent = `Цвет фона: ${background.name.toLowerCase()}.`;
    });
}

const clocks = document.querySelectorAll('[data-clock]');
if (clocks.length) {
    function updateClock() {
        const now = new Date();
        const readable = now.toLocaleString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        clocks.forEach((clock) => {
            clock.textContent = readable;
            clock.setAttribute('datetime', now.toISOString());
        });
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// Filter the existing gallery in place. With JavaScript off, all covers remain visible.
const filter = document.querySelector('#archiveFilter');
if (filter) {
    const covers = document.querySelectorAll('[data-release-year]');
    const count = document.querySelector('#archiveCount');
    filter.hidden = false;
    filter.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-year]');
        if (!button || !filter.contains(button)) return;
        const year = button.dataset.year;
        let visible = 0;
        covers.forEach((cover) => {
            cover.hidden = year !== 'all' && cover.dataset.releaseYear !== year;
            if (!cover.hidden) visible += 1;
        });
        filter.querySelectorAll('button').forEach((item) => {
            item.setAttribute('aria-pressed', String(item === button));
        });
        count.textContent = `Показано: ${visible} из ${covers.length}`;
    });
}
