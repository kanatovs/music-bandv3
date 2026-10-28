const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(projectRoot, 'music-library.js'), 'utf8');

function loadLibrary() {
    const context = vm.createContext({});
    vm.runInContext(source, context);
    return vm.runInContext('musicLibrary', context);
}

test('catalogue contains nine distinct releases with existing cover files', () => {
    const library = loadLibrary();
    assert.equal(library.catalogue.length, 9);
    assert.equal(new Set(library.catalogue.map((release) => release.id)).size, 9);
    for (const release of library.catalogue) {
        assert.match(release.id, /^[a-z0-9-]+$/);
        assert.ok(release.title.trim());
        assert.ok(fs.existsSync(path.join(projectRoot, release.cover)));
        assert.equal(library.getById(release.id), release);
    }
    assert.equal(library.getById('missing'), undefined);
});

test('year filtering returns the correct releases and handles unknown years', () => {
    const library = loadLibrary();
    assert.equal(library.filterByYear('all').length, 9);
    assert.equal(library.filterByYear(2022).length, 2);
    assert.equal(library.filterByYear('2023').length, 4);
    assert.equal(library.filterByYear('2024').length, 2);
    assert.equal(library.filterByYear('2025').length, 1);
    assert.equal(library.filterByYear('unknown').length, 0);
    assert.equal(library.filterByYear(null).length, 0);
    assert.ok(library.filterByYear(2024).every((release) => release.year === 2024));
    const filtered = library.filterByYear('all');
    filtered.pop();
    assert.equal(library.catalogue.length, 9);
});

test('collection rejects duplicates and unknown releases and can remove entries', () => {
    const library = loadLibrary();
    const collection = library.createCollection();
    const first = library.catalogue[0].id;
    const second = library.catalogue[1].id;
    assert.equal(collection.count(), 0);
    assert.equal(collection.add(first), true);
    assert.equal(collection.add(first), false);
    assert.equal(collection.add('missing'), false);
    assert.equal(collection.add('__proto__'), false);
    assert.equal(collection.add(second), true);
    assert.equal(collection.count(), 2);
    assert.deepEqual(Array.from(collection.items), [first, second]);
    assert.equal(collection.remove(first), true);
    assert.equal(collection.remove(first), false);
    assert.equal(collection.remove('missing'), false);
    assert.deepEqual(Array.from(collection.items), [second]);
    assert.equal(collection.count(), 1);
});

test('collection snapshots and separate collections cannot change each other', () => {
    const library = loadLibrary();
    const firstCollection = library.createCollection();
    const secondCollection = library.createCollection();
    const id = library.catalogue[0].id;
    firstCollection.add(id);
    firstCollection.items.pop();
    assert.equal(firstCollection.count(), 1);
    assert.equal(secondCollection.count(), 0);
    assert.equal(firstCollection.setRating(id, 4), true);
    const copiedRatings = firstCollection.ratings;
    copiedRatings[id] = 1;
    assert.equal(firstCollection.getRating(id), 4);
    assert.equal(secondCollection.getRating(id), 0);
});

test('ratings are scoped to releases and accept only whole values from one to five', () => {
    const library = loadLibrary();
    const collection = library.createCollection();
    const first = library.catalogue[0].id;
    const second = library.catalogue[1].id;
    assert.equal(collection.getRating(first), 0);
    assert.equal(collection.setRating(first, 1), true);
    assert.equal(collection.setRating(second, 5), true);
    for (const value of [0, 6, -1, 2.5, NaN, '4', null, undefined]) {
        assert.equal(collection.setRating(first, value), false);
    }
    assert.equal(collection.setRating('missing', 3), false);
    assert.equal(collection.setRating('__proto__', 3), false);
    assert.equal(collection.getRating(first), 1);
    assert.equal(collection.getRating(second), 5);
    assert.equal(collection.getRating('missing'), 0);
    assert.equal(collection.setRating(first, 3), true);
    assert.equal(collection.getRating(first), 3);
});
