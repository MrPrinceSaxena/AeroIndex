# Contributing to AeroIndex (APIx)

Welcome to the **AeroIndex (APIx)** development team! This repository powers a real-time sovereign airfare price index for India's NSO, RBI, and DGCA (Smart India Hackathon — SIH 26056).

---

## 1. Development Workflow

### Prerequisites
* **Python 3.9+** with virtual environment (`.venv`)
* **Node.js 18+** & **npm**
* **Playwright** (`playwright install chromium`)

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/itsksfit/itsksfit.git
cd AeroIndex_SIH

# 2. Python Backend Setup
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium

# 3. Frontend Setup
cd frontend
npm install
npm run dev
```

---

## 2. Testing & Quality Checks

Before submitting any Pull Request, ensure that both test suites pass with 100% success rate:

```bash
# Backend unit & integration tests (149 tests)
pytest

# Frontend type checking and bundle build
cd frontend
npm run build
```

---

## 3. Pull Request Guidelines

1. **Commit Convention**: Follow Conventional Commits:
   * `feat(area): description`
   * `fix(area): description`
   * `docs(area): description`
2. **Zero Breaking Changes**: Do not break existing API response schemas or frontend views.
3. **Data Integrity**: Never hardcode synthetic estimates into real scraper feeds. Preserve `source_name` tags.
