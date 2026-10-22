const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, (error, bytes) => {
        if (error) { response.writeHead(404).end(); return; }
        response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
        response.end(bytes);
    });
});

async function run() {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = (process.env.TEST_BASE_URL || `http://127.0.0.1:${server.address().port}`).replace(/\/$/, '');
    const browser = await chromium.launch({ headless: true, ...(process.env.TEST_BROWSER ? { channel: process.env.TEST_BROWSER } : {}) });
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        for (const width of [320, 390, 768, 992, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            for (const name of ['index', 'tour', 'about', 'contact', 'media-queries']) {
                await page.goto(`${base}/${name}.html`);
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: overflow at ${width}`);
                await page.evaluate(() => { for (const image of document.images) image.loading = 'eager'; });
                await page.waitForFunction(() => [...document.images].every(image => image.complete));
                assert.ok(await page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0)), `${name}: broken image`);
            }
        }
        await page.goto(`${base}/index.html`);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.locator('.navbar-toggler').click();
        await page.waitForFunction(() => document.querySelector('#mainNav').classList.contains('show'));
        assert.equal(await page.locator('.navbar-toggler').getAttribute('aria-expanded'), 'true');
        await page.locator('.navbar-toggler').click();
        await page.waitForFunction(() => !document.querySelector('#mainNav').classList.contains('show'));
        await page.setViewportSize({ width: 1440, height: 900 });
        for (const [year, count] of [['2022', 2], ['2023', 4], ['2024', 2], ['2025', 1], ['all', 9]]) {
            await page.locator(`button[data-year="${year}"]`).click();
            assert.equal(await page.locator('[data-release-year]:visible').count(), count);
            assert.match(await page.locator('#archiveCount').innerText(), new RegExp(`Показано: ${count} из 9`));
            assert.equal(await page.locator('#archiveFilter button[aria-pressed="true"]').count(), 1);
        }
        if (process.env.SCREENSHOT_DIR) {
            fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
            await page.goto(`${base}/index.html`);
            await page.setViewportSize({ width: 1440, height: 900 });
            await page.evaluate(() => window.scrollTo(0, 0));
            await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'home-desktop.png') });
            await page.setViewportSize({ width: 390, height: 844 });
            await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'home-mobile.png') });
        }

        // Keep the newer main-branch controls covered while integrating the PR.
        const firstClock = await page.locator('[data-clock]').getAttribute('datetime');
        assert.ok(firstClock && !Number.isNaN(Date.parse(firstClock)), 'clock has an ISO timestamp');
        await page.waitForFunction(previous => document.querySelector('[data-clock]').dateTime !== previous, firstClock);
        const initialBackground = await page.locator('[data-background-label]').innerText();
        for (const name of ['Лесной', 'Фиолетовый', 'Вишнёвый', initialBackground]) {
            await page.locator('[data-change-background]').click();
            assert.equal(await page.locator('[data-background-label]').innerText(), name);
        }
        const opener = page.locator('[data-open-subscribe]');
        for (const close of ['button', 'escape', 'outside']) {
            await opener.click();
            assert.equal(await page.locator('#subscribeDialog').getAttribute('open'), '');
            if (close === 'button') await page.locator('[data-close-subscribe]').click();
            if (close === 'escape') await page.keyboard.press('Escape');
            if (close === 'outside') await page.mouse.click(2, 2);
            await page.waitForFunction(() => !document.querySelector('#subscribeDialog').open);
            await page.waitForFunction(() => document.activeElement.matches('[data-open-subscribe]'));
        }
        await page.goto(`${base}/about.html`);
        for (const button of await page.locator('[data-accordion-button]').all()) {
            const panel = page.locator(`#${await button.getAttribute('aria-controls')}`);
            assert.equal(await button.getAttribute('aria-expanded'), 'false');
            assert.ok(await panel.evaluate(element => element.inert));
            await button.click();
            assert.equal(await button.getAttribute('aria-expanded'), 'true');
            assert.equal(await panel.getAttribute('aria-hidden'), 'false');
            assert.equal(await panel.evaluate(element => element.inert), false);
            await button.click();
            assert.equal(await button.getAttribute('aria-expanded'), 'false');
            assert.equal(await panel.getAttribute('aria-hidden'), 'true');
        }
        await page.goto(`${base}/contact.html`);
        await page.evaluate(() => { for (const image of document.images) image.loading = 'eager'; });
        await page.waitForFunction(() => [...document.images].every(image => image.complete));
        const requests = [];
        page.on('request', request => requests.push(request.url()));
        const form = page.locator('#communityForm');
        const submit = form.locator('button[type="submit"]');
        await submit.click();
        assert.equal(await form.locator('[aria-invalid="true"]').count(), 5);
        await page.locator('#name').fill('   ');
        await page.locator('#email').fill('test@example.com');
        await page.locator('#message').fill('   ');
        await submit.click();
        assert.match(await page.locator('#nameError').innerText(), /пробелов/);
        assert.match(await page.locator('#messageError').innerText(), /пробелов/);
        await page.locator('#name').fill('Test');
        await page.locator('#message').fill('Local demo test');
        await page.locator('#email').fill('invalid-email');
        await page.locator('#password').fill('short');
        await page.locator('#confirmPassword').fill('different');
        await submit.click();
        assert.equal(await form.locator('[aria-invalid="true"]').count(), 3);
        await page.locator('#email').fill('test@example.com');
        await page.locator('#password').fill('Example123!');
        await page.locator('#confirmPassword').fill('Example123!');
        await submit.click();
        assert.equal(await page.locator('#formStatus').getAttribute('data-state'), 'success');
        assert.match(await page.locator('#formStatus').innerText(), /не отправлены и не сохранены/);
        assert.equal(await page.locator('#password').inputValue(), '');
        assert.equal(await page.locator('#confirmPassword').inputValue(), '');
        await form.locator('button[type="reset"]').click();
        assert.equal(await page.locator('#formStatus').innerText(), '');
        assert.equal(await form.locator('[aria-invalid="true"]').count(), 0);
        await page.locator('[data-open-subscribe]').click();
        const newsletter = page.locator('#newsletterForm');
        await newsletter.locator('button[type="submit"]').click();
        assert.equal(await newsletter.locator('[aria-invalid="true"]').count(), 2);
        await newsletter.locator('[name="name"]').fill('Test');
        await newsletter.locator('[name="email"]').fill('test@example.com');
        await newsletter.locator('button[type="submit"]').click();
        assert.equal(await newsletter.locator('[data-form-status]').getAttribute('data-state'), 'success');
        assert.deepEqual(requests, [], 'form must not transmit data');
        assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0, 'forms must not persist data');
        assert.deepEqual(errors, [], 'browser errors');
        const withoutJs = await browser.newContext({ javaScriptEnabled: false });
        const plain = await withoutJs.newPage();
        await plain.goto(`${base}/index.html`);
        assert.equal(await plain.locator('[data-release-year]:visible').count(), 9);
        await plain.goto(`${base}/contact.html`);
        for (const button of await plain.locator('button[type="submit"], [data-open-subscribe], [data-change-background]').all()) {
            assert.ok(await button.isDisabled());
        }
        await withoutJs.close();
        console.log('PASS: 25 layouts, images, mobile navigation, five filters, clock, four backgrounds, popup controls, FAQ, both forms/validation/reset/no transmission/no storage, no-JavaScript fallback');
    } finally {
        await browser.close();
    }
}

run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
