// Browser-local accounts and listening preferences for the course project.
(function () {
    'use strict';

    function createListenerStore(options = {}) {
        const accountsKey = 'music-band-accounts-v1';
        const sessionKey = 'music-band-session-v1';
        const collectionPrefix = 'music-band-collection-v1:';
        const cryptoProvider = options.crypto || globalThis.crypto;
        const getStorage = options.getStorage || (() => options.storage);

        function storage() {
            try {
                const value = getStorage();
                if (!value) throw new Error();
                return value;
            } catch {
                throw new Error('Браузер не разрешил доступ к памяти. Разреши сохранение данных сайта и повтори.');
            }
        }

        function read(key, fallback) {
            let raw;
            try {
                raw = storage().getItem(key);
            } catch (error) {
                throw new Error('Не удалось прочитать данные браузера. Проверь разрешение на сохранение.');
            }
            if (raw === null) return fallback;
            try {
                return JSON.parse(raw);
            } catch {
                throw new Error('Сохранённые данные повреждены. Открой сайт в другом профиле браузера.');
            }
        }

        function write(key, value) {
            try {
                storage().setItem(key, JSON.stringify(value));
            } catch {
                throw new Error('Не удалось сохранить данные. Проверь свободное место и разрешения браузера.');
            }
        }

        function publicUser(account) {
            return { id: account.id, name: account.name, email: account.email, phone: account.phone };
        }

        function readAccounts() {
            const accounts = read(accountsKey, []);
            const valid = Array.isArray(accounts) && accounts.every((account) =>
                account && typeof account.id === 'string' && account.id.length > 0 &&
                typeof account.name === 'string' && typeof account.email === 'string' &&
                typeof account.phone === 'string' && account.password &&
                /^[a-f0-9]{32}$/.test(account.password.salt) &&
                /^[a-f0-9]{64}$/.test(account.password.hash) &&
                account.password.iterations === 100000
            );
            if (!valid) throw new Error('Сохранённые аккаунты имеют неподдерживаемый формат.');
            return accounts;
        }

        function getCurrentUser() {
            const session = read(sessionKey, null);
            if (!session || typeof session.userId !== 'string') return null;
            const account = readAccounts().find((item) => item.id === session.userId);
            return account ? publicUser(account) : null;
        }

        function toHex(bytes) {
            return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
        }

        async function derivePassword(password, salt) {
            if (!cryptoProvider || !cryptoProvider.subtle) {
                throw new Error('Для учебного входа открой сайт по HTTPS или через localhost.');
            }
            const key = await cryptoProvider.subtle.importKey(
                'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
            );
            const saltBytes = Uint8Array.from(salt.match(/../g), (value) => parseInt(value, 16));
            const bits = await cryptoProvider.subtle.deriveBits(
                { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' }, key, 256
            );
            return toHex(new Uint8Array(bits));
        }

        async function signUp(details) {
            const name = String(details.name || '').trim();
            const email = String(details.email || '').trim().toLowerCase();
            const phone = String(details.phone || '').replace(/[\s()-]/g, '');
            const password = String(details.password || '');
            if (!name || !email || !phone || !password) throw new Error('Заполни все поля регистрации.');
            if (readAccounts().some((account) => account.email === email)) {
                throw new Error('Этот email уже зарегистрирован. Перейди ко входу.');
            }
            if (!cryptoProvider || !cryptoProvider.subtle) {
                throw new Error('Для учебной регистрации открой сайт по HTTPS или через localhost.');
            }
            const salt = toHex(cryptoProvider.getRandomValues(new Uint8Array(16)));
            const hash = await derivePassword(password, salt);
            // Read again after hashing so another completed registration is retained.
            const accounts = readAccounts();
            if (accounts.some((account) => account.email === email)) {
                throw new Error('Этот email уже зарегистрирован. Перейди ко входу.');
            }
            const account = {
                id: cryptoProvider.randomUUID(),
                name, email, phone,
                password: { salt, hash, iterations: 100000 }
            };
            write(accountsKey, [...accounts, account]);
            return publicUser(account);
        }

        async function logIn(email, password) {
            const normalizedEmail = String(email).trim().toLowerCase();
            const account = readAccounts().find((item) => item.email === normalizedEmail);
            if (!account || await derivePassword(String(password), account.password.salt) !== account.password.hash) {
                throw new Error('Email или пароль не совпадают. Проверь ввод и попробуй ещё раз.');
            }
            write(sessionKey, { userId: account.id });
            return publicUser(account);
        }

        function logOut() {
            try {
                storage().removeItem(sessionKey);
            } catch {
                throw new Error('Не удалось завершить вход. Проверь разрешения браузера.');
            }
        }

        function collectionKey() {
            const user = getCurrentUser();
            return collectionPrefix + (user ? user.id : 'guest');
        }

        function cleanCollection(value) {
            if (!value || !Array.isArray(value.items) || !value.ratings ||
                typeof value.ratings !== 'object' || Array.isArray(value.ratings)) {
                throw new Error('Сохранённая подборка имеет неподдерживаемый формат.');
            }
            const items = [...new Set(value.items.filter((id) =>
                typeof id === 'string' && /^[a-z0-9-]+$/.test(id)
            ))];
            const ratings = {};
            for (const [id, rating] of Object.entries(value.ratings)) {
                if (/^[a-z0-9-]+$/.test(id) && Number.isInteger(rating) && rating >= 1 && rating <= 5) {
                    ratings[id] = rating;
                }
            }
            return { items, ratings };
        }

        function readCollection() {
            return cleanCollection(read(collectionKey(), { items: [], ratings: {} }));
        }

        function writeCollection(value) {
            write(collectionKey(), cleanCollection(value));
        }

        return { signUp, logIn, logOut, getCurrentUser, readCollection, writeCollection };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createListenerStore };
    }
    if (typeof window !== 'undefined') {
        window.listenerStore = createListenerStore({
            getStorage: () => window.localStorage, crypto: window.crypto
        });
    }
})();
