# Releasing IonConfig

A release is published by GitHub Actions (`.github/workflows/build.yml`).
Pushing a `v*` tag builds the editor, CLI, and release tree, runs the
Playwright suite as a gate, and creates a GitHub Release with three assets:

- `ionconfig-<ver>.tar.gz`
- `ionconfig-<ver>.zip`
- `SHA256SUMS`

The Release is marked as a prerelease when the version has a letter suffix
(for example `4.10.0b1`).

`dorelease.sh` is still the legacy local path and is unchanged.

## Procedure

1. Edit `release.json` (`ionConfigVersion`, `seqNum`, `desc`) and add a
   `Release Notes <version>` section at the top of `release.notes`. The
   section is used as the GitHub Release body. If it is missing, GitHub's
   generated notes are used.
2. Merge the change to `main`. The `Build` workflow runs on the merge.
3. Tag the same commit with the version from `release.json`, prefixed with `v`:

   ```sh
   git tag v4.10.0b1        # must equal "v" + ionConfigVersion
   git push origin v4.10.0b1
   ```

4. Open the Actions run for the tag. When it passes, check the Releases page
   for the three assets.

A tag that does not match `release.json` fails the `release` job before
anything is published.

## Dry run (no publishing)

Run the `Build` workflow manually with `dry_run` set to `true`. This creates a
**draft** release named `dry-run-<version>-<run id>` with the same three assets.
Inspect it, then delete the draft and its `dry-run-<version>-<run id>` tag. A manual run with
`dry_run` left as `false` builds and tests only.

## Local verification

```sh
./script/test-check-tag.sh     # tag/version logic
./script/test-ci-verify.sh     # release layout checks
./script/ci-build.sh           # builds dist/ionconfig-<ver>.{tar.gz,zip}
./script/ci-verify-release.sh dist/ionconfig-<ver>.tar.gz <ver>
```

Use the Node version in `.nvmrc` (currently 24). `ci-build.sh` restores
`editor/src/App.jsx` on exit, so the working tree is unchanged after a build.

## Known gaps

- `release.json` (4.10.0b1) and `editor/package.json` (4.9.0) disagree.
  `release.json` is the source of truth; `editor/package.json` is not updated.
- The CLI has no automated tests. The verify script only checks that the CLI
  loads its modules.
- `license.txt` is not included in the release, matching `dorelease.sh`.
