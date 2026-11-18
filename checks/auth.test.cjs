const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const test = require('node:test');
const { createListenerStore } = require('../js/listener-store.js');

function memoryStorage() {
    const values = new Map();
    return {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, value); },
        removeItem(key) { values.delete(key); },
        values
    };
}

function listener(email = 'alex@example.com') {
    return { name: 'Alex', email, phone: '+7 (700) 123-45-67', password: 'MusicBand!4' };
}

function storeFor(storage) {
    return createListenerStore({ storage, crypto: webcrypto });
}

test('registration stores a salted password verifier and normalized details', async () => {
    const storage = memoryStorage();
    const store = storeFor(storage);
    const details = { ...listener(), name: '  Alex  ', email: '  ALEX@EXAMPLE.COM  ' };
    const user = await store.signUp(details);
    assert.equal(user.name, 'Alex');
    assert.equal(user.email, 'alex@example.com');
    assert.equal(user.phone, '+77001234567');
    assert.equal(user.password, undefined);
    const raw = storage.getItem('music-band-accounts-v1');
    assert.equal(raw.includes(details.password), false);
    const account = JSON.parse(raw)[0];
    assert.match(account.password.salt, /^[a-f0-9]{32}$/);
    assert.match(account.password.hash, /^[a-f0-9]{64}$/);
    assert.equal(store.getCurrentUser(), null);
});

test('login verifies the password and restores the same user after reload', async () => {
    const storage = memoryStorage();
    const store = storeFor(storage);
    const user = await store.signUp(listener());
    await assert.rejects(store.logIn(user.email, 'wrong-password'), /не совпадают/);
    assert.equal(store.getCurrentUser(), null);
    const loggedIn = await store.logIn(' ALEX@EXAMPLE.COM ', listener().password);
    assert.deepEqual(loggedIn, user);
    assert.deepEqual(storeFor(storage).getCurrentUser(), user);
    store.logOut();
    assert.equal(storeFor(storage).getCurrentUser(), null);
});

test('registration rejects duplicate emails without replacing the original account', async () => {
    const storage = memoryStorage();
    const store = storeFor(storage);
    await store.signUp(listener());
    await assert.rejects(store.signUp(listener('ALEX@example.com')), /уже зарегистрирован/);
    assert.equal(JSON.parse(storage.getItem('music-band-accounts-v1')).length, 1);
});

test('guest and account collections persist separately, including ratings', async () => {
    const storage = memoryStorage();
    const store = storeFor(storage);
    store.writeCollection({ items: ['dom'], ratings: { dom: 4 } });
    await store.signUp(listener());
    await store.logIn(listener().email, listener().password);
    assert.deepEqual(store.readCollection(), { items: [], ratings: {} });
    store.writeCollection({ items: ['skoro'], ratings: { skoro: 5 } });
    assert.deepEqual(storeFor(storage).readCollection(), { items: ['skoro'], ratings: { skoro: 5 } });
    store.logOut();
    assert.deepEqual(store.readCollection(), { items: ['dom'], ratings: { dom: 4 } });
});

test('two listeners have independent collections', async () => {
    const storage = memoryStorage();
    const store = storeFor(storage);
    for (const email of ['alex@example.com', 'dana@example.com']) {
        await store.signUp(listener(email));
    }
    await store.logIn('alex@example.com', listener().password);
    store.writeCollection({ items: ['dom'], ratings: { dom: 3 } });
    await store.logIn('dana@example.com', listener().password);
    assert.deepEqual(store.readCollection(), { items: [], ratings: {} });
    store.writeCollection({ items: ['skoro'], ratings: { skoro: 4 } });
    await store.logIn('alex@example.com', listener().password);
    assert.deepEqual(store.readCollection(), { items: ['dom'], ratings: { dom: 3 } });
});

test('collections discard duplicate IDs and invalid rating values', () => {
    const store = storeFor(memoryStorage());
    store.writeCollection({
        items: ['dom', 'dom', '__proto__', 3],
        ratings: { dom: 5, skoro: 6, 'bad id': 3, 'moimi-glazami': 2.5 }
    });
    assert.deepEqual(store.readCollection(), { items: ['dom'], ratings: { dom: 5 } });
});

test('corrupt accounts are reported and retained instead of overwritten', async () => {
    const storage = memoryStorage();
    storage.setItem('music-band-accounts-v1', '{broken');
    const store = storeFor(storage);
    await assert.rejects(store.signUp(listener()), /повреждены/);
    assert.equal(storage.getItem('music-band-accounts-v1'), '{broken');
});

test('storage denial cannot report successful registration or login', async () => {
    const storage = memoryStorage();
    const store = storeFor(storage);
    const originalWrite = storage.setItem;
    storage.setItem = () => { throw new Error('Quota exceeded'); };
    await assert.rejects(store.signUp(listener()), /Не удалось сохранить/);
    storage.setItem = originalWrite;
    await store.signUp(listener());
    storage.setItem = () => { throw new Error('Quota exceeded'); };
    await assert.rejects(store.logIn(listener().email, listener().password), /Не удалось сохранить/);
    assert.equal(store.getCurrentUser(), null);
});

test('missing Web Crypto reports a suitable browser context requirement', async () => {
    const store = createListenerStore({ storage: memoryStorage(), crypto: {} });
    await assert.rejects(store.signUp(listener()), /HTTPS/);
});
