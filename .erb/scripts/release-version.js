/* Simple release helper to:
 *  - bump the version (patch/minor/major)
 *  - sync root package.json and release/app/package.json
 *  - commit the change
 *  - create a git tag vX.Y.Z
 *  - push commit and tag
 *
 * Usage (from project root):
 *   node ./.erb/scripts/release-version.js patch   # default
 *   node ./.erb/scripts/release-version.js minor
 *   node ./.erb/scripts/release-version.js major
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const bumpType = process.argv[2] || 'patch'; // patch | minor | major

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error(`Invalid bump type "${bumpType}". Use patch | minor | major.`);
  process.exit(1);
}

const rootPkgPath = path.join(__dirname, '..', '..', 'package.json');
const appPkgPath = path.join(
  __dirname,
  '..',
  '..',
  'release',
  'app',
  'package.json',
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function bumpVersion(version, type) {
  const parts = version.split('.').map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid semver version: ${version}`);
  }

  let [major, minor, patch] = parts;

  if (type === 'patch') {
    patch += 1;
  } else if (type === 'minor') {
    minor += 1;
    patch = 0;
  } else if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  }

  return `${major}.${minor}.${patch}`;
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const rootPkg = readJson(rootPkgPath);
  const appPkg = readJson(appPkgPath);

  const currentVersion = rootPkg.version || appPkg.version;
  if (!currentVersion) {
    throw new Error('version not found in package.json files');
  }

  const newVersion = bumpVersion(currentVersion, bumpType);

  console.log(
    `Bumping version: ${currentVersion} -> ${newVersion} (${bumpType})`,
  );

  rootPkg.version = newVersion;
  appPkg.version = newVersion;

  writeJson(rootPkgPath, rootPkg);
  writeJson(appPkgPath, appPkg);

  // Stage files
  execSync(`git add "${rootPkgPath}" "${appPkgPath}"`, { stdio: 'inherit' });

  // Determine current branch
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

  const tagName = `v${newVersion}`;
  const defaultMsg = `Release ${tagName}`;

  const userMsg = await prompt(
    `Commit message (press Enter to use "${defaultMsg}"): `,
  );
  const commitMsg = userMsg || defaultMsg;

  console.log(`Committing changes: "${commitMsg}" on branch ${branch}`);
  execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });

  console.log(`Creating tag ${tagName}`);
  execSync(`git tag ${tagName}`, { stdio: 'inherit' });

  console.log(`Pushing branch ${branch} and tag ${tagName} to origin`);
  execSync(`git push origin ${branch}`, { stdio: 'inherit' });
  execSync(`git push origin ${tagName}`, { stdio: 'inherit' });

  console.log('\nRelease prepared successfully.');
  console.log(`   New version: ${newVersion}`);
  console.log(`   Tag: ${tagName}`);
  console.log(
    '   GitHub Actions "Publish" workflow will now build and publish the release.',
  );
}

main().catch((err) => {
  console.error('Failed to prepare release:', err.message || err);
  process.exit(1);
});
