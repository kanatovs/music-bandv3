// Shared form rules are implemented in JavaScript, independently of HTML constraints.
(() => {
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

    const requiredMessages = {
        name: 'Введи имя.',
        email: 'Введи email.',
        phone: 'Введи телефон.',
        password: 'Придумай пароль.',
        loginPassword: 'Введи пароль.',
        confirmPassword: 'Повтори пароль.',
        message: 'Напиши сообщение.'
    };

    function getError(field, form) {
        const rule = field.dataset.validation;
        const value = field.value;
        const trimmed = value.trim();
        if (!trimmed) return requiredMessages[rule] || 'Заполни это поле.';

        switch (rule) {
            case 'name':
                return trimmed.length <= 80 ? '' : 'Имя должно содержать не больше 80 символов.';
            case 'email':
                return isValidEmail(value) ? '' : 'Введи корректный email, например name@example.com.';
            case 'phone': {
                const normalized = value.replace(/[ ()-]/g, '');
                return /^\+7[0-9]{10}$/.test(normalized) ? '' : 'Введи телефон в формате +7 700 123 45 67.';
            }
            case 'password':
                if (value.length < 8 || value.length > 72 || /\s/.test(value)) {
                    return 'Пароль должен содержать от 8 до 72 символов без пробелов.';
                }
                if (!/\p{Lu}/u.test(value) || !/\p{Ll}/u.test(value) || !/[0-9]/.test(value) || !/[\p{P}\p{S}]/u.test(value)) {
                    return 'Добавь заглавную и строчную буквы, цифру и специальный символ.';
                }
                return '';
            case 'confirmPassword': {
                const password = form.elements.namedItem('password');
                return password && value === password.value ? '' : 'Пароли не совпадают.';
            }
            case 'message':
                return trimmed.length <= 2000 ? '' : 'Сообщение должно содержать не больше 2000 символов.';
            default:
                return '';
        }
    }

    function showError(field, message) {
        const error = field.ownerDocument.getElementById(`${field.id}Error`);
        field.setAttribute('aria-invalid', String(Boolean(message)));
        field.classList.toggle('is-invalid', Boolean(message));
        if (error) {
            error.textContent = message;
            error.hidden = !message;
        }
    }

    function validate(form) {
        return Array.from(form.querySelectorAll('[data-validation]')).filter((field) => {
            const message = getError(field, form);
            showError(field, message);
            return Boolean(message);
        });
    }

    const validation = { isValidEmail, getError, showError, validate };
    if (typeof window !== 'undefined') window.formValidation = validation;
    if (typeof module !== 'undefined' && module.exports) module.exports = validation;
})();
