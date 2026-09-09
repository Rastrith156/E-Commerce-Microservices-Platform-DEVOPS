# Git Workflow

This project uses a GitFlow-style model with review-first collaboration.

## Branch roles

| Pattern | Purpose | Created from | Merged into |
|---|---|---|---|
| `main` | Production-ready releases | — | — |
| `develop` | Integration for completed work | `main` initially | — |
| `feature/*` | Individual development work | `develop` | `develop` |
| `release/*` | Release preparation | `develop` | `main`, then back to `develop` |
| `hotfix/*` | Urgent production fixes | `main` | `main`, then back to `develop` |

Feature examples: `feature/catalog-api`, `feature/cart-api`, `feature/order-api`, and `feature/frontend`.

## Complete feature workflow

1. **Start from `develop`.**
   ```bash
   git checkout develop
   ```
2. **Pull the latest changes.**
   ```bash
   git pull origin develop
   ```
3. **Create a feature branch.**
   ```bash
   git checkout -b feature/catalog-api
   ```
4. **Implement the change.** Keep it focused on one concern.
5. **Test locally.** Run the affected component's tests and record the results.
6. **Commit the change.**
   ```bash
   git add .
   git commit -m "feat: add catalog API"
   ```
7. **Push the branch.**
   ```bash
   git push -u origin feature/catalog-api
   ```
8. **Open a Pull Request** from `feature/catalog-api` into `develop` and complete the template.
9. **Get at least one approving review.**
10. **Fix requested changes,** retest, commit, and push updates to the same branch.
11. **Merge into `develop`** only after approval and applicable checks pass.
12. **Delete the feature branch** locally and remotely after merge.
   ```bash
   git checkout develop
   git pull origin develop
   git branch -d feature/catalog-api
   git push origin --delete feature/catalog-api
   ```

## Release workflow

Create `release/<version>` from `develop`, allow only release stabilization changes, and open a PR to `main`. After release approval and merge, tag the release and merge the resulting release changes back into `develop` so branches do not diverge.

Example:

```bash
git checkout develop
git pull origin develop
git checkout -b release/1.0.0
git push -u origin release/1.0.0
```

## Hotfix workflow

Create `hotfix/<description>` from `main`, make the smallest safe correction, and open a reviewed PR to `main`. After merging, also merge or cherry-pick the fix into `develop`.

Example:

```bash
git checkout main
git pull origin main
git checkout -b hotfix/order-total
git push -u origin hotfix/order-total
```

## GitHub branch protection (manual configuration)

Branch protection has **not** been configured by local repository setup. A repository administrator should configure it after the repository exists on GitHub.

### Protect `main`

1. Open the GitHub repository.
2. Select **Settings → Branches** (or **Settings → Rules → Rulesets**, depending on the GitHub UI).
3. Choose **Add branch protection rule** or **New branch ruleset**.
4. Target branch name pattern: `main`.
5. Enable **Require a pull request before merging**.
6. Set **Required approvals** to at least **1**.
7. Enable dismissal of stale approvals when new commits are pushed if available.
8. Prevent direct pushes by restricting updates to the PR flow; do not grant bypass access except to explicitly authorized administrators.
9. Enable **Block force pushes** / leave **Allow force pushes** disabled.
10. Leave deletion of the protected branch disabled.
11. When CI/CD is implemented later, enable **Require status checks to pass before merging**, select the real test/security check names, and require the branch to be up to date if appropriate. Do not invent check names before workflows exist.
12. Save and verify the rule using a non-production test branch or a test PR.

### Protect `develop`

Create a second rule targeting `develop` and preferably enable:

- Require a Pull Request before merging.
- Require at least one approving review.
- Prevent direct and force pushes.
- Require real status checks after CI/CD exists.

Repository owners may keep limited administrative bypass for emergencies, but routine work must use Pull Requests.

## Pull request direction summary

```text
feature/*  -> develop
release/*  -> main (then synchronize develop)
hotfix/*   -> main (then synchronize develop)
```
