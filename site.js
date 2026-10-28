// Suggested study responsibility: Kanatov Sabyrzhan — validation and popup.
// These forms are local demonstrations: no data is sent or saved.
// Check a practical ASCII email format, without claiming the mailbox exists.
function isValidEmail(value) {
    if (typeof value !== 'string') return false;
    const email = value.trim();
    if (email.length > 254) return false;
    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const [local, domain] = parts;
    if (!local || local.length > 64) return false;
    if (!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+$/.test(local)) return false;
    if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;

    const labels = domain.split('.');
    if (labels.length < 2) return false;
    const validLabels = labels.every((label) => {
        return label.length >= 1 && label.length <= 63 &&
            /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label);
    });
    if (!validLabels) return false;
    const topLevelDomain = labels[labels.length - 1];
    return topLevelDomain.length >= 2 && /[A-Za-z]/.test(topLevelDomain);
}

document.querySelectorAll('form[data-validate]').forEach((form) => {
    const fields = Array.from(form.querySelectorAll('[required]'));
    const status = form.querySelector('[data-form-status]');
    const submitButton = form.querySelector('button[type="submit"]');
    const steps = Array.from(form.querySelectorAll('[data-form-step]'));
    const progress = form.querySelector('[data-form-progress]');
    const stepStatus = form.querySelector('#formStepStatus');
    const nextButton = form.querySelector('#formNext');
    const backButton = form.querySelector('#formBack');
    let currentStep = 0;
    form.noValidate = true;
    submitButton.disabled = false;

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
        if (field.name === 'email' && (field.validity.typeMismatch || !isValidEmail(value))) {
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

    function validateFields(selectedFields) {
        const invalidFields = [];
        selectedFields.forEach((field) => {
            const message = getError(field);
            showError(field, message);
            if (message) invalidFields.push(field);
        });
        return invalidFields;
    }

    function reportInvalidFields(invalidFields) {
        status.textContent = `Проверь отмеченные поля: ${invalidFields.length}. Данные не отправлены.`;
        status.dataset.state = 'error';
        invalidFields[0].focus();
    }

    function renderFormStep(index) {
        steps.forEach((step, stepIndex) => {
            step.hidden = stepIndex !== index;
        });
        form.querySelectorAll('[data-step-label]').forEach((label, labelIndex) => {
            const active = labelIndex === index;
            label.classList.toggle('form-step-active', active);
            if (active) label.setAttribute('aria-current', 'step');
            else label.removeAttribute('aria-current');
        });
        stepStatus.textContent = `Шаг ${index + 1} из ${steps.length}: ${steps[index].dataset.stepTitle}`;
        backButton.hidden = index === 0;
        nextButton.hidden = index === steps.length - 1;
        submitButton.hidden = index !== steps.length - 1;
    }

    // The state changes first; the supplied callback updates the visible step.
    function goToStep(index, onStepChange) {
        if (index < 0 || index >= steps.length) return;
        currentStep = index;
        onStepChange(currentStep);
    }

    function focusCurrentStep() {
        const firstControl = steps[currentStep].querySelector('input, select, textarea');
        if (firstControl) firstControl.focus();
    }

    function advanceStep() {
        const currentFields = fields.filter((field) => steps[currentStep].contains(field));
        const invalidFields = validateFields(currentFields);
        if (invalidFields.length) {
            reportInvalidFields(invalidFields);
            return;
        }
        clearStatus();
        goToStep(currentStep + 1, renderFormStep);
        focusCurrentStep();
    }

    if (steps.length) {
        progress.hidden = false;
        goToStep(0, renderFormStep);
        nextButton.addEventListener('click', advanceStep);
        backButton.addEventListener('click', function goBack() {
            clearStatus();
            goToStep(currentStep - 1, renderFormStep);
            focusCurrentStep();
        });
        form.addEventListener('keydown', function handleStepEnter(event) {
            if (event.key !== 'Enter' || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
            if (currentStep === steps.length - 1 || event.target.tagName !== 'INPUT') return;
            event.preventDefault();
            advanceStep();
        });
    }

    form.addEventListener('submit', function submitForm(event) {
        event.preventDefault();
        if (steps.length && currentStep < steps.length - 1) {
            advanceStep();
            return;
        }
        const invalidFields = validateFields(fields);
        if (invalidFields.length) {
            if (steps.length) {
                const invalidStep = steps.findIndex((step) => step.contains(invalidFields[0]));
                goToStep(invalidStep, renderFormStep);
            }
            reportInvalidFields(invalidFields);
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
        if (steps.length) goToStep(0, renderFormStep);
    });
});

// Arrow keys move between visible navigation links; Tab keeps its native behavior.
document.querySelectorAll('#mainNav, nav[data-keyboard-nav]').forEach((menu) => {
    menu.addEventListener('keydown', function handleMenuKeydown(event) {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        const focusedLink = event.target.closest('a[href]');
        if (!focusedLink || !menu.contains(focusedLink)) return;
        const selector = menu.id === 'mainNav' ? 'a.nav-link[href]' : 'a[href]';
        const links = Array.from(menu.querySelectorAll(selector)).filter((link) => {
            return link.getClientRects().length > 0 && getComputedStyle(link).visibility !== 'hidden';
        });
        const index = links.indexOf(focusedLink);
        if (index === -1) return;
        let nextIndex;
        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                nextIndex = (index + 1) % links.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                nextIndex = (index - 1 + links.length) % links.length;
                break;
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = links.length - 1;
                break;
            default:
                return;
        }
        event.preventDefault();
        links[nextIndex].focus();
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
