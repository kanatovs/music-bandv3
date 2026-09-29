// Local feedback only: the assignment has no message delivery service.
const form = document.querySelector('#communityForm');
if (form) {
    const status = document.querySelector('#formStatus');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        status.textContent = 'Форма заполнена корректно. Это демо: сообщение не отправлено, данные не сохранены.';
    });
    form.addEventListener('reset', () => { status.textContent = ''; });
    form.addEventListener('input', () => { status.textContent = ''; });
}
