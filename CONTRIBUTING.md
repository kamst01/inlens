# Contributing to InLens

## One-time repository setup

Complete every item before merging the initial Version Packages pull request:

1. Create the GitHub repository and push `main`.
2. Install the [Changesets GitHub Bot](https://github.com/apps/changeset-bot) for the repository. The bot
   gives pull request authors a non-blocking reminder when a changeset may be missing.
3. In the repository's Actions settings, give workflow `GITHUB_TOKEN` read and write permissions and
   allow GitHub Actions to create pull requests.
4. Add an `NPM_TOKEN` repository secret with permission to publish all three packages. The release
   workflow exposes it only to the Changesets action as `NODE_AUTH_TOKEN`.
5. Confirm that the `@inlens` npm scope grants the publishing account permission to create
   `@inlens/core`, `@inlens/react`, and `@inlens/next`.
6. Protect `main`: require pull requests, resolved conversations, an up-to-date branch, and the `Tests`
   status check; disable force pushes and branch deletion.

The packages intentionally begin at `0.0.0`. The committed initial minor changeset makes the first
Version Packages pull request set all three to `0.1.0` and create their first changelogs.

## Branch model

InLens uses trunk-based development:

- `main` is protected and must remain releasable.
- Use short-lived `feature/<name>` and `fix/<name>` branches.
- Codex-created branches use `codex/<name>`.
- `changeset-release/main` is owned by the Changesets GitHub Action.
- Add maintenance branches only when an older major genuinely needs continued support.

Pull requests should normally be squash-merged. Do not force-push or delete `main`, manually edit the
generated release branch, or move a published release tag.

## Adding changesets

Every pull request that changes a public package should include:

```sh
npm run changeset
```

Select the affected packages, choose `patch`, `minor`, or `major`, and write a concise user-facing
summary. `@inlens/core`, `@inlens/react`, and `@inlens/next` are a fixed group, so Changesets applies the
highest pending SemVer impact and releases all three at the same version.

Not every change requires a release. Documentation, examples, tests, and internal tooling changes do not
need a changeset, and the Changesets GitHub Bot is intentionally non-blocking. If branch policy is ever
changed to require `changeset status --since main`, use `npm run changeset -- --empty` for a deliberately
non-releasing pull request.

Review the accumulated release plan with:

```sh
npm run changeset:status
```

## Automated versioning and publishing

On every push to `main`, the Changesets GitHub Action does one of two things:

1. If changesets are pending, it creates or updates the Version Packages pull request by running
   `npm run version-packages`. Review the generated package versions, dependency ranges, changelogs, and
   lockfile.
2. If the Version Packages pull request has been merged, it runs `npm run release`, publishes every
   unpublished package, creates `@inlens/*@X.Y.Z` tags, and creates GitHub releases.

The Version Packages pull request is the release queue. Wait for its `Test` check, review it, and merge it
to release. Do not run a separate versioning tool, edit package versions manually, or create release tags
by hand.

## Manual fallback

If GitHub Actions is unavailable, pause merges to `main` and follow the same two-stage process manually:

```sh
npm run version-packages
git add .
git commit -m "Version Packages"
```

Review and merge that version commit. From the updated `main`, run:

```sh
npm run release
git push --follow-tags
```

Resume merges only after npm publication and tag pushing complete.

## Prereleases and hotfixes

Use Changesets prerelease mode only from a dedicated prerelease branch:

```sh
npm run changeset -- pre enter beta
```

For a hotfix to the current release, branch from `main`, add a patch changeset, and use the normal Version
Packages flow. If an older major must be patched, add a maintenance branch and a separate Changesets
release workflow for that branch.
