// The fan archive is static: validate the form locally without sending data.
const form = document.querySelector('#communityForm');
if (form) {
    const status = document.querySelector('#formStatus');
    form.querySelector('button[type="submit"]').disabled = false;
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        if (!form.elements.name.value.trim() || !form.elements.message.value.trim()) {
            status.textContent = 'Добавь имя и сообщение: поля не должны состоять только из пробелов.';
            return;
        }
        status.textContent = 'Форма заполнена корректно. Это демо: сообщение не отправлено, данные не сохранены.';
    });
    form.addEventListener('reset', () => { status.textContent = ''; });
    form.addEventListener('input', () => { status.textContent = ''; });
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
