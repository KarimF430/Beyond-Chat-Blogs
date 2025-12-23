# 🚀 BeyondChats Full-Stack Assignment

A complete article scraping, AI-powered content enhancement, and display system.

## 📁 Project Structure

```
Beyond Chats Assignment/
├── laravel-api/          # Backend API (PHP/Laravel)
├── node-script/          # Content Enhancement (Node.js)
├── react-frontend/       # Frontend UI (React/Vite)
└── README.md
```

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PHASE 1: Data Collection                      │
├─────────────────────────────────────────────────────────────────────┤
│  BeyondChats Blog ──────> WordPress REST API ──────> Laravel DB     │
│  (5 oldest articles)       (Scraping)              (SQLite)         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PHASE 2: Content Enhancement                     │
├─────────────────────────────────────────────────────────────────────┤
│  Laravel API ──> Node.js ──> DuckDuckGo ──> Scrape 5 Competitors    │
│      │              │                              │                 │
│      │              ▼                              │                 │
│      │      Google Gemini AI                       │                 │
│      │         (Enhance + Gap Analysis)            │                 │
│      │              │                              │                 │
│      ◄──────────────┴──────────────────────────────┘                │
│  (Publish enhanced article with citations)                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PHASE 3: Display                                 │
├─────────────────────────────────────────────────────────────────────┤
│  React Frontend ◄──────── Laravel API                               │
│  - Article List (Original 🟦 / Enhanced 🟩)                         │
│  - Gap Analysis Panel (🔴 Missing, 🟡 Improve, 🟢 Strengths)        │
│  - Competitor Articles Reference                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 🛠️ Local Setup Instructions

### Prerequisites
- PHP 8.1+ with Composer
- Node.js 18+
- Google Gemini API Key (free: https://makersuite.google.com/app/apikey)

### 1️⃣ Laravel Backend

```bash
cd laravel-api

# Install dependencies
composer install

# Create database and run migrations
php artisan migrate

# Scrape initial articles
php artisan serve &
curl -X POST http://127.0.0.1:8000/api/scrape

# Keep server running on port 8000
php artisan serve --host=0.0.0.0 --port=8000
```

### 2️⃣ Node.js Enhancement Script

```bash
cd node-script

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your Gemini API key to .env
# GEMINI_API_KEY=your_key_here

# Run the enhancement (requires Laravel API running)
npm start
```

### 3️⃣ React Frontend

```bash
cd react-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List all articles (filter: ?status=original) |
| GET | `/api/articles/{id}` | Get single article |
| POST | `/api/articles` | Create article |
| PUT | `/api/articles/{id}` | Update article |
| DELETE | `/api/articles/{id}` | Delete article |
| GET | `/api/articles-latest` | Get latest original article |
| GET | `/api/articles/{id}/competitors` | Get competitor articles |
| POST | `/api/scrape` | Trigger BeyondChats scraping |

## 🎨 Frontend Features

- **Dark Theme** with modern gradients
- **Filter Articles**: All / Original / Enhanced
- **Gap Analysis Panel**: Color-coded insights
  - 🔴 Missing topics
  - 🟡 Areas to improve
  - 🟢 Strengths
  - 💡 Recommendations
- **Competitor Cards**: Reference articles shown
- **Responsive Design**: Mobile-friendly

## 🔗 Live Demo

Frontend: [Coming Soon - Deploy to Vercel]

## 📝 Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Laravel 12 + PHP 8.5 |
| Database | SQLite |
| Script | Node.js + ES Modules |
| LLM | Google Gemini (Free) |
| Search | DuckDuckGo / SerpAPI |
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (Dark Theme) |

## 👤 Author

Built for BeyondChats Assignment

---

Made with ❤️ using Laravel, Node.js, and React
