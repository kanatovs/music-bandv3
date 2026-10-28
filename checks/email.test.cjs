const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'site.js'), 'utf8');
const context = vm.createContext({
    document: {
        querySelectorAll: () => [],
        querySelector: () => null
    }
});
vm.runInContext(source, context);
const isValidEmail = vm.runInContext('isValidEmail', context);

test('rejects the reported comma-only email and comma characters', () => {
    for (const value of [',,,@,,,.,,', 'name,last@example.com', 'name@example,com']) {
        assert.equal(isValidEmail(value), false, value);
    }
});

test('accepts ordinary, tagged, dotted, uppercase and punycode addresses', () => {
    const values = [
        'name@example.com',
        'user+tag@sub.example.co.uk',
        'First.Last@EXAMPLE.COM',
        'user@xn--e1afmkfd.xn--p1ai',
        "o'hara@example.com",
        'user@archive-2.example.com',
        '  name@example.com  '
    ];
    for (const value of values) assert.equal(isValidEmail(value), true, value);
});

test('rejects whitespace and line breaks within an address', () => {
    const values = [
        'first last@example.com',
        'name @example.com',
        'name@exam ple.com',
        'na\nme@example.com',
        'name@exam\nple.com',
        'name@exam\tple.com'
    ];
    for (const value of values) assert.equal(isValidEmail(value), false, value);
});

test('requires exactly one at sign and both address parts', () => {
    for (const value of ['', 'name', '@example.com', 'name@', 'name@@example.com', 'name@other@example.com']) {
        assert.equal(isValidEmail(value), false, value);
    }
});

test('rejects leading, trailing and repeated local-part dots', () => {
    for (const value of ['.name@example.com', 'name.@example.com', 'a..b@example.com', '"name"@example.com']) {
        assert.equal(isValidEmail(value), false, value);
    }
});

test('requires valid ASCII domain labels and a usable top-level domain', () => {
    const values = [
        'a@.example.com',
        'a@example..com',
        'a@example.com.',
        'a@exam_ple.com',
        'a@-example.com',
        'a@example-.com',
        'a@localhost',
        'a@example.c',
        'a@example.123',
        'a@пример.com',
        'имя@example.com'
    ];
    for (const value of values) assert.equal(isValidEmail(value), false, value);
});

test('enforces the local-part and domain-label length boundaries', () => {
    assert.equal(isValidEmail(`${'a'.repeat(64)}@example.com`), true);
    assert.equal(isValidEmail(`${'a'.repeat(65)}@example.com`), false);
    assert.equal(isValidEmail(`a@${'b'.repeat(63)}.com`), true);
    assert.equal(isValidEmail(`a@${'b'.repeat(64)}.com`), false);
});

test('accepts 254 characters but rejects 255 even with individually valid labels', () => {
    const local = 'a'.repeat(64);
    const validDomain = `${'b'.repeat(63)}.${'c'.repeat(61)}.${'d'.repeat(63)}`;
    const longDomain = `${'b'.repeat(63)}.${'c'.repeat(62)}.${'d'.repeat(63)}`;
    const boundary = `${local}@${validDomain}`;
    const excessive = `${local}@${longDomain}`;
    assert.equal(boundary.length, 254);
    assert.equal(excessive.length, 255);
    assert.equal(isValidEmail(boundary), true);
    assert.equal(isValidEmail(excessive), false);
});

test('returns false for values that are not strings', () => {
    for (const value of [null, undefined, 123, {}, []]) {
        assert.equal(isValidEmail(value), false);
    }
});
