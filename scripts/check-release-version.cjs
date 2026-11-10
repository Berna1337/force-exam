const assert = require('node:assert/strict');
const { version } = require('../package.json');
const lock = require('../package-lock.json');

assert.match(version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'Use a full release version, such as 0.2.0');
assert.equal(lock.version, version, 'package-lock.json version must match package.json');
assert.equal(lock.packages[''].version, version, 'Lockfile root version must match package.json');
if (process.env.GITHUB_REF_TYPE === 'tag') {
  assert.equal(process.env.GITHUB_REF_NAME, `v${version}`, 'Release tag must match package.json; bump the package version before tagging');
}
console.log(`Release version verified: ${version}`);
