const assert = require('node:assert/strict');
const test = require('node:test');
const { getError } = require('../js/validation.js');

function validateValue(rule, value, password = '') {
    const field = { dataset: { validation: rule }, value };
    const form = { elements: { namedItem: () => ({ value: password }) } };
    return getError(field, form);
}

test('required fields reject empty and whitespace-only values using JavaScript rules', () => {
    for (const rule of ['name', 'email', 'phone', 'password', 'loginPassword', 'confirmPassword', 'message']) {
        assert.notEqual(validateValue(rule, ''), '', rule);
        assert.notEqual(validateValue(rule, '  \t '), '', rule);
    }
});

test('names and messages enforce their JavaScript length limits', () => {
    assert.equal(validateValue('name', '  Dana  '), '');
    assert.equal(validateValue('name', 'a'.repeat(80)), '');
    assert.notEqual(validateValue('name', 'a'.repeat(81)), '');
    assert.equal(validateValue('message', 'a'.repeat(2000)), '');
    assert.notEqual(validateValue('message', 'a'.repeat(2001)), '');
});

test('phone accepts Kazakhstan-format numbers with common display separators', () => {
    for (const value of ['+77001234567', '+7 700 123 45 67', '+7 (700) 123-45-67', ' +7 700 123 45 67 ']) {
        assert.equal(validateValue('phone', value), '', value);
    }
});

test('phone rejects incorrect prefixes, lengths and characters', () => {
    for (const value of ['87001234567', '+17001234567', '+7700123456', '+770012345678', '+7abc1234567', '+7/700/1234567', '+7700\n1234567', '+7+7001234567']) {
        assert.notEqual(validateValue('phone', value), '', value);
    }
});

test('signup password requires all complexity classes without whitespace', () => {
    assert.equal(validateValue('password', 'Archive1!'), '');
    assert.equal(validateValue('password', 'Музыка1!'), '');
    for (const value of ['Short1!', 'archive1!', 'ARCHIVE1!', 'Archive!!', 'Archive12', 'Archive 1!', 'Archive1!\n']) {
        assert.notEqual(validateValue('password', value), '', value);
    }
});

test('signup password checks the upper length boundary', () => {
    assert.equal(validateValue('password', 'Aa1!' + 'b'.repeat(68)), '');
    assert.notEqual(validateValue('password', 'Aa1!' + 'b'.repeat(69)), '');
});

test('password confirmation compares the complete original values', () => {
    assert.equal(validateValue('confirmPassword', 'Archive1!', 'Archive1!'), '');
    assert.notEqual(validateValue('confirmPassword', 'Archive2!', 'Archive1!'), '');
    assert.notEqual(validateValue('confirmPassword', ' Archive1!', 'Archive1!'), '');
});

test('login validates presence and leaves credential verification to authentication', () => {
    assert.equal(validateValue('loginPassword', 'wrong'), '');
    assert.equal(validateValue('loginPassword', 'Archive1!'), '');
});

test('email fields reuse the strict address checker', () => {
    assert.equal(validateValue('email', 'listener+tag@example.com'), '');
    assert.notEqual(validateValue('email', ',,,@,,,.,,'), '');
    assert.notEqual(validateValue('email', 'listener@example..com'), '');
});
