const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
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
    const base = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch({ headless: true, ...(process.env.TEST_BROWSER ? { channel: process.env.TEST_BROWSER } : {}) });
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        for (const width of [320, 768, 1440]) {
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
        await page.goto(`${base}/contact.html`);
        const requests = [];
        page.on('request', request => {
            if (request.method() !== 'GET' || request.postData() || request.resourceType() === 'document' || !request.url().startsWith(base + '/')) requests.push(request.url());
        });
        await page.locator('#name').fill('   ');
        await page.locator('#email').fill('test@example.com');
        await page.locator('#message').fill('   ');
        await page.locator('button[type="submit"]').click();
        assert.match(await page.locator('#formStatus').innerText(), /пробелов/);
        await page.locator('#name').fill('Test');
        await page.locator('#message').fill('Local demo test');
        await page.locator('button[type="submit"]').click();
        assert.match(await page.locator('#formStatus').innerText(), /не отправлено/);
        await page.locator('button[type="reset"]').click();
        assert.equal(await page.locator('#formStatus').innerText(), '');
        assert.equal(requests.length, 0, 'form must not transmit data');
        assert.deepEqual(errors, [], 'browser errors');
        const withoutJs = await browser.newContext({ javaScriptEnabled: false });
        const plain = await withoutJs.newPage();
        await plain.goto(`${base}/index.html`);
        assert.equal(await plain.locator('[data-release-year]:visible').count(), 9);
        await plain.goto(`${base}/contact.html`);
        assert.ok(await plain.locator('button[type="submit"]').isDisabled());
        await withoutJs.close();
        console.log('PASS: 15 layouts, images, five filters, form validation/reset/no transmission, no-JavaScript fallback');
    } finally {
        await browser.close();
    }
}

run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
