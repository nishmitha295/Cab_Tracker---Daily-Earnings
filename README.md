# 🚕 Cab Tracker — Daily Earnings

A mobile-first PWA for cab drivers to track daily income, expenses, and profit in minutes.

## Features

- 📊 **Dashboard** — Today's income, expenses & profit at a glance
- 💰 **Add Income** — Log daily earnings with optional notes
- 🧾 **Add Expenses** — Track diesel, food, parking, repair, service & other costs
- 📅 **History** — View all past entries
- 📈 **Reports** — Weekly & monthly bar charts with income/expense/profit breakdown
- 🔐 **PIN Login** — Simple 4-digit PIN authentication, no email needed
- 📱 **PWA** — Install on Android/iPhone as a home screen app, works offline

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL) |
| Auth | Custom PIN-based auth with localStorage |
| PWA | vite-plugin-pwa + Workbox |
| Icons | Lucide React |

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/nishmitha295/Cab_Tracker---Daily-Earnings.git
cd Cab_Tracker---Daily-Earnings
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create a `.env` file in the root:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Setup Supabase database
Run the SQL from `supabase/migrations/` in your Supabase SQL Editor to create the required tables.

### 5. Run locally
```bash
npm run dev
```

### 6. Build for production
```bash
npm run build
```


## Install as Mobile App (PWA)

**Android:** Open in Chrome → 3-dot menu → Add to Home screen

**iPhone:** Open in Safari → Share → Add to Home Screen


