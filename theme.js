// Apply the saved theme before the stylesheets load.
(() => {
    const root = document.documentElement;
    const storageKey = 'music-band-theme';

    try {
        if (localStorage.getItem(storageKey) === 'light') {
            root.dataset.bsTheme = 'light';
        }
    } catch {
        // The theme still works for this page when storage is unavailable.
    }

    document.addEventListener('DOMContentLoaded', () => {
        const button = document.querySelector('[data-theme-toggle]');
        if (!button) return;

        button.setAttribute('aria-pressed', String(root.dataset.bsTheme === 'light'));
        button.disabled = false;
        button.addEventListener('click', () => {
            const theme = root.dataset.bsTheme === 'light' ? 'dark' : 'light';
            root.dataset.bsTheme = theme;
            button.setAttribute('aria-pressed', String(theme === 'light'));

            try {
                localStorage.setItem(storageKey, theme);
            } catch {
                // Keep the current theme even if the preference cannot be saved.
            }
        });
    });
})();
