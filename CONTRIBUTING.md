# Contributing

Thank you for contributing to the E-Commerce Microservices Platform. These rules keep changes reviewable, traceable, and safe.

## Branch naming

Create work from the correct base branch and use lowercase kebab-case descriptions.

| Branch | Base | Purpose | Example |
|---|---|---|---|
| `feature/*` | `develop` | New functionality | `feature/catalog-api` |
| `release/*` | `develop` | Release stabilization | `release/1.0.0` |
| `hotfix/*` | `main` | Urgent production correction | `hotfix/order-total` |

Do not commit feature work directly to `main` or `develop`.

## Commit messages

Use Conventional Commits in the form `type: concise imperative description`. Keep commits focused and meaningful; avoid mixing unrelated refactors, features, and formatting.

Examples:

```text
feat: add catalog API
fix: correct cart calculation
docs: update Git workflow
test: add order service tests
refactor: simplify product controller
```

Common types include `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, and `build`.

## Pull request requirements

Every Pull Request should:

- target the correct branch (`develop` for features; follow the documented release/hotfix flow);
- have a clear title and completed PR template;
- explain the change, motivation, affected services, and tests performed;
- link a related issue when available;
- be focused and small enough to review;
- update relevant documentation;
- contain no secrets, passwords, private keys, access tokens, or API keys;
- have all applicable tests passing.

## Code review

- At least one approving review is required before merge.
- Authors must resolve or respond to requested changes.
- Reviewers should check correctness, scope, tests, security, readability, and documentation.
- Authors must not approve their own work as the required review.

## Testing expectations

- Run tests for every affected component before opening or updating a PR.
- Add or update tests when behavior changes.
- Document exact commands and results in the PR's **Testing** section.
- If a component has no automated tests yet, document the manual validation performed; do not claim automated coverage.

## Security and sensitive data

- Never commit `.env` files, credentials, secrets, passwords, API keys, tokens, or private certificates.
- Use local environment variables and commit only safe examples such as `.env.example` when needed.
- If a secret is committed, rotate it immediately and notify the repository maintainer; deleting the file alone is insufficient because Git retains history.

## Merging

- Merge only after required approval and applicable checks pass.
- Do not bypass branch protection or force-push protected branches.
- Prefer a clean history using the merge method configured by the repository owner.
- Delete merged feature branches.
- `main` receives production-ready changes through reviewed release or hotfix Pull Requests.

See [`docs/git-workflow.md`](docs/git-workflow.md) for step-by-step commands.
