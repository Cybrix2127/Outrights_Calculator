
# 2026 Outrights Calculator

A web-based dashboard to compute monthly outrights for 2026 based on EFFR and FOMC meeting changes.

## Setup & Run

### Requirements
- Python 3.8+
- Flask

### Install dependencies
```bash
pip install -r requirements.txt
```

### Start the server
```bash
python app.py
```

Then open your browser to **http://localhost:5001**

## Usage

- **EFFR**: Enter current effective federal funds rate (e.g. `5.25%` or `525bps`)
- **Special Rates**: Month-end, quarter-end, year-end adjustments in basis points
- **Meeting Changes**: For each FOMC date, enter the expected rate change in bps (e.g. `25`, `-25`, `+25bps`)
- **Compute**: Click to recalculate monthly outrights
- **Save Case**: Store current inputs and results for later comparison
- **Compare**: Select 2+ saved cases to view side-by-side outrights and spreads
- **Export**: Download results as CSV or multi-sheet Excel workbook

## How it Works

- Iterates through each day of 2026
- Applies FOMC meeting rate changes **effective the next day** after the meeting
- Applies ME/QE/YE adjustments on last working day of each period
- Computes daily-averaged effective rates for each month
- Calculates outrights as: **Outright = 100 − Average Monthly Rate**
- Calculates 1M spreads as difference between consecutive month outrights

## Input Formats

| Format | Example | Interpretation |
|--------|---------|----------------|
| Percentage | `5.25%` | 5.25 percent |
| Basis points | `25bps` | 0.25 percent |
| Plain number | `25` | 25 basis points (0.25%) |
| Negative | `-25` | −25 basis points |

## Free Deployment Options

### Option 1: Render (Recommended — Easiest)

1. Push your code to a GitHub repository
2. Go to [render.com](https://render.com) → Sign up free with GitHub
3. Click **New → Web Service**
4. Connect your GitHub repo
5. Render auto-detects the `render.yaml` — just confirm settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
6. Select the **Free** plan → Click **Deploy**
7. Your app will be live at `https://outrights-calculator.onrender.com`

> ⚠️ Free tier spins down after 15 min of inactivity (cold starts take ~30s)

---

### Option 2: Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → Sign up with GitHub
3. Click **New Project → Deploy from GitHub Repo**
4. Select your repo — Railway auto-detects the `Dockerfile`
5. App deploys automatically with a public URL
6. Free tier: $5/month credit (more than enough for this app)

---

### Option 3: Fly.io

1. Install the Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
2. Sign up and authenticate:
   ```bash
   fly auth signup
   ```
3. Launch the app:
   ```bash
   fly launch
   ```
4. Deploy:
   ```bash
   fly deploy
   ```
5. Free tier: 3 shared VMs with 256MB RAM

---

### Option 4: PythonAnywhere

1. Go to [pythonanywhere.com](https://www.pythonanywhere.com) → Sign up free
2. Go to **Web** tab → **Add a new web app** → Choose **Flask** → Python 3.10
3. Upload your files via the **Files** tab
4. Set the WSGI config to point to your `app.py`:
   ```python
   import sys
   sys.path.insert(0, '/home/yourusername/myapp')
   from app import app as application
   ```
5. Click **Reload** → App is live at `yourusername.pythonanywhere.com`

> ✅ Free tier stays online 24/7 (no cold starts), but limited to 1 web app

---

### Quick Start (push to GitHub first)

```bash
# Initialize git repo
git init
git add .
git commit -m "Initial commit - 2026 Outrights Calculator"

# Add your GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/outrights-calculator.git
git push -u origin main
```

Then connect the repo to any platform above.

### Important Note on `cases.json`

The saved cases feature uses a local `cases.json` file. On platforms with **ephemeral filesystems** (Render, Railway, Fly.io), this file resets on each deploy/restart. For persistent storage, consider upgrading to a database (SQLite with a volume, or a free PostgreSQL instance on Render/Railway). PythonAnywhere preserves files across restarts.
