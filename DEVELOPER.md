# 👨‍💻 DEVELOPER GUIDE

Welcome to the **Footwear POS** project.

This document explains the Git workflow, development standards, and contribution process for all developers.

---

# 📌 Branch Strategy

We use the following Git branching model.

```text
master
   │
   │
develop
   │
   ├───────────────┬───────────────┬───────────────
   │               │               │
siva-dev      vivek-dev      developer-name-dev
```

## Branch Purpose

### `master`

* Production branch
* Always stable
* Contains released code only
* Never commit directly

---

### `develop`

* Main development branch
* All completed work is merged here
* QA testing is performed here
* Only reviewed code should be merged

---

### Developer Branches

Each developer must have their own branch.

Examples:

```
siva-dev
vivek-dev
rahul-dev
john-dev
```

Never commit directly to:

* master
* develop

---

# 🚀 Initial Setup

Clone the repository.

```bash
git clone <repository-url>

cd ElectronFootwear
```

Fetch all branches.

```bash
git fetch --all
```

Checkout your developer branch.

Example:

```bash
git checkout siva-dev
```

If the branch doesn't exist locally:

```bash
git checkout -b siva-dev origin/siva-dev
```

---

# 🔄 Daily Workflow

Before starting work:

```bash
git checkout develop

git pull origin develop
```

Switch back to your branch.

```bash
git checkout siva-dev
```

Merge the latest changes.

```bash
git merge develop
```

Resolve conflicts if any.

---

# 💻 Coding

Do your development only in your own branch.

Example:

```bash
git add .

git commit -m "Add thermal receipt improvements"

git push origin siva-dev
```

---

# 🔀 Creating a Pull Request

When your work is complete:

```
siva-dev
        │
        ▼
develop
```

Create a Pull Request:

```
Source:
siva-dev

Destination:
develop
```

Do not merge your own Pull Request without review.

---

# 🧪 Testing

The following should be verified before requesting a merge.

* Login
* Dashboard
* Billing
* Receipt Printing
* Products
* Customers
* Reports
* Inventory
* Backup
* Restore

Application must build successfully.

```bash
npm run build
```

---

# 🚀 Release Process

Once testing is complete:

```
developer branch

↓

develop

↓

master
```

Only the project maintainer should merge:

```
develop

↓

master
```

After release:

```
git tag v1.0.0

git push origin v1.0.0
```

---

# 📌 Commit Message Format

Use meaningful commit messages.

Good examples:

```
Add thermal receipt template

Fix login validation

Improve stock report

Add barcode printing

Fix invoice calculation
```

Avoid messages like:

```
update

test

changes

final

code
```

---

# 📂 Project Structure

```
backend/
    Express API
    MongoDB Models
    Controllers
    Routes
    Services

frontend/
    Electron Main
    Electron Preload
    React Renderer
    Components
    Context
    Hooks
    Pages
    Services
    Templates
```

---

# 📋 Development Rules

✅ Pull latest `develop` before starting work.

✅ Work only on your own branch.

✅ Keep commits small and meaningful.

✅ Test your feature before pushing.

✅ Resolve merge conflicts carefully.

✅ Never force push to shared branches.

---

# ❌ Never Do

Do NOT:

* Commit directly to `master`
* Commit directly to `develop`
* Force push to `master`
* Force push to `develop`
* Push unfinished code to `develop`
* Delete shared branches

---

# 🛠 Build Commands

Backend

```bash
cd backend

npm install

npm run dev
```

Frontend

```bash
cd frontend

npm install

npm run dev
```

Production Build

```bash
npm run build
```

Electron Package

```bash
npm run dist
```

---

# 🌿 Git Flow

```
master
   ▲
   │
develop
 ▲   ▲   ▲
 │   │   │
 │   │   └── vivek-dev
 │   │
 │   └────── siva-dev
 │
 └────────── developer-dev
```

Workflow:

```
Developer Branch
        │
        ▼
     develop
        │
        ▼
      master
```

---

# 👥 Team Responsibilities

### Developers

* Develop features
* Fix bugs
* Write clean code
* Submit Pull Requests

### Team Lead / Maintainer

* Review Pull Requests
* Merge into `develop`
* Perform testing
* Merge `develop` into `master`
* Create releases

---

# 📞 Need Help?

If you encounter:

* Merge conflicts
* Build failures
* Database issues
* Electron packaging issues

Contact the project maintainer before merging any code.

---

Happy Coding! 🚀
