const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeMusicReleases } = require('../js/music-api.js');

const firstId = '02919e14-0fc6-402e-a015-80e7d89440fa';
const secondId = '043b683c-4375-4dbe-98dc-347dd193f4cd';

test('normalizes the MusicBrainz response and sorts newest releases first', () => {
    const releases = normalizeMusicReleases({ 'release-groups': [
        { id: secondId, title: 'всегда ненавидел быть слабым', 'first-release-date': '2024-09-27', 'primary-type': 'Album' },
        { id: firstId, title: ' я не могу не писать музыку ', 'first-release-date': '2026-01-30', 'primary-type': 'Album' }
    ] });
    assert.equal(releases[0].id, firstId);
    assert.equal(releases[0].title, 'я не могу не писать музыку');
    assert.equal(releases[1]['first-release-date'], '2024-09-27');
});

test('rejects invalid schemas and unusable records while accepting an empty catalogue', () => {
    for (const payload of [null, {}, { 'release-groups': 'invalid' }]) {
        assert.throws(() => normalizeMusicReleases(payload));
    }
    assert.deepEqual(normalizeMusicReleases({ 'release-groups': [] }), []);
    assert.throws(() => normalizeMusicReleases({ 'release-groups': [{ id: 'javascript:alert(1)', title: 'Invalid' }] }));
});

test('ignores duplicate IDs and unknown fields and preserves titles as plain data', () => {
    const release = { id: firstId, title: '<script>example</script>', 'first-release-date': 'wrong', 'primary-type': null, secret: 'discard' };
    const result = normalizeMusicReleases({ 'release-groups': [null, release, release] });
    assert.equal(result.length, 1);
    assert.equal(result[0].title, '<script>example</script>');
    assert.equal(result[0]['first-release-date'], '');
    assert.equal(result[0]['primary-type'], '');
    assert.equal('secret' in result[0], false);
});
