# Contributing to Breathe

Thank you for your interest in contributing to Breathe.

## Development Setup

### Prerequisites

- Node.js 20+
- npm (this project uses npm, run commands with `npx`)
- Expo Go installed on an Android or iOS device, or a mobile simulator

### Getting Started

```bash
git clone https://github.com/Vatsal057/breathe.git
cd breathe
npm install
npx expo start
```

Scan the QR code with Expo Go (or press `a` for Android emulator, `i` for iOS simulator).

## Quality Checks

Run these before opening a pull request:

```bash
npx tsc --noEmit     # TypeScript typecheck (strict)
npx expo lint        # ESLint check
```

Both must pass cleanly with zero errors and warnings.

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature or technique
- `fix:` bug fix
- `docs:` documentation or guidance updates
- `refactor:` code refactoring without behavior changes
- `chore:` maintenance, dependencies, tooling

Keep commits atomic, descriptive, and well-scoped.

## Pull Requests

1. Fork the repo and create a feature branch (`git checkout -b feat/my-improvement`).
2. Make your changes and verify with `npx tsc --noEmit` and `npx expo lint`.
3. Open a pull request against `main` using the PR template.
