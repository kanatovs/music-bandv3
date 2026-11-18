// Restore page preferences before the stylesheets load.
(() => {
    const root = document.documentElement;
    const themes = ['dark', 'light'];
    const backgrounds = ['default', 'forest', 'lilac', 'rose'];

    function remember(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch {
            // Preferences still apply to the current page without storage.
        }
    }

    try {
        const theme = localStorage.getItem('music-band-theme');
        const background = localStorage.getItem('music-band-background');
        if (themes.includes(theme)) root.dataset.bsTheme = theme;
        if (backgrounds.includes(background)) root.dataset.background = background;
    } catch {
        // Use the default palette when saved preferences cannot be read.
    }

    document.addEventListener('DOMContentLoaded', () => {
        const settings = document.querySelector('[data-settings]');
        if (!settings) return;
        const themeButtons = settings.querySelectorAll('[data-set-theme]');
        const backgroundSelect = settings.querySelector('[data-background-select]');

        function updateControls() {
            themeButtons.forEach((button) => {
                button.setAttribute('aria-pressed', String(button.dataset.setTheme === root.dataset.bsTheme));
            });
            backgroundSelect.value = root.dataset.background || 'default';
        }

        themeButtons.forEach((button) => {
            button.disabled = false;
            button.addEventListener('click', () => {
                root.dataset.bsTheme = button.dataset.setTheme;
                remember('music-band-theme', root.dataset.bsTheme);
                updateControls();
            });
        });
        backgroundSelect.disabled = false;
        backgroundSelect.addEventListener('change', () => {
            if (!backgrounds.includes(backgroundSelect.value)) return;
            root.dataset.background = backgroundSelect.value;
            remember('music-band-background', backgroundSelect.value);
        });
        document.addEventListener('pointerdown', (event) => {
            if (!settings.contains(event.target)) settings.open = false;
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && settings.open) {
                settings.open = false;
                settings.querySelector('summary').focus();
            }
        });
        updateControls();
    });
})();
