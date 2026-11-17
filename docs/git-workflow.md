# Git Workflow

This repository uses `main` as its only long-lived branch and source of truth.
Work branches are short-lived and should be deleted after their pull requests
are merged.

## Feature workflow

1. **Update `main`.**
   ```bash
   git switch main
   git pull --ff-only origin main
   ```
2. **Create a short-lived work branch.**
   ```bash
   git switch -c feature/catalog-api
   ```
3. **Implement and test the change.** Keep it focused and run the affected
   component's tests.
4. **Commit and push the branch.**
   ```bash
   git add .
   git commit -m "feat: add catalog API"
   git push -u origin feature/catalog-api
   ```
5. **Open a Pull Request** from `feature/catalog-api` into `main`. Complete the
   repository template and record the exact test commands and results.
6. **Merge after review and checks pass.** Do not bypass branch protection or
   force-push.
7. **Delete the work branch.**
   ```bash
   git switch main
   git pull --ff-only origin main
   git branch -d feature/catalog-api
   git push origin --delete feature/catalog-api
   ```

Use descriptive lowercase kebab-case names such as `feature/cart-api`,
`fix/order-total`, or `docs/git-workflow`.

## GitHub branch protection

Configure protection for `main` in **Settings → Branches** or
**Settings → Rules → Rulesets**:

- Require pull requests before merging and at least one approval.
- Dismiss stale approvals when new commits are pushed, if available.
- Require the actual CI checks after they have been observed in the repository.
- Block force pushes and branch deletion.

## Pull request direction

```text
short-lived work branch -> main -> delete work branch
```
