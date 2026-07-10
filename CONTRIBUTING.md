# Contributing

Thanks for taking the time to contribute! This is a small, dependency-free Chrome
extension (Manifest V3, plain JavaScript, no build step), so getting set up is quick.

## Setup

1. Fork and clone the repo.
2. Open Chrome, go to `chrome://extensions`, enable **Developer mode**, click **Load
   unpacked**, and select the repo folder.
3. After changing any file, click the reload icon on the extension's card in
   `chrome://extensions` to pick up your changes. For content-script changes
   (`scripts/card.js`, `scripts/content.js`, `scripts/i18n.js`), also reload any open tab
   you're testing on.

See the [README](README.md) for how the extension is used and how the code is laid out.

## Making changes

- Keep pull requests focused on one change — a bug fix, a feature, a refactor. Don't bundle
  unrelated changes together.
- This project has no build step or bundler; scripts are loaded as-is, so keep them valid,
  dependency-free JavaScript.
- Match the existing code style (no semicolons-optional inconsistency, 2-space indent,
  same patterns already used in the file you're editing).
- All UI-facing strings go through `scripts/i18n.js` — add new keys there for every
  supported language (or at minimum English, and open an issue/PR noting which languages
  still need translation) rather than hardcoding text in a script or HTML file.
- Before submitting, sanity-check your change by actually loading the extension and
  exercising the feature you touched (there's no automated test suite yet).

## Commit messages

```
<type>: <imperative summary>

- what changed and why
```

Types: `feature`, `bugfix`, `refactor`, `chore`, `docs`, `style`, `perf`.

## Reporting bugs / suggesting features

Open an issue with steps to reproduce (for bugs) or the problem you're trying to solve
(for feature requests). Screenshots help.
