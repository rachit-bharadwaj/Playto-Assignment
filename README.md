# Playto Engineering Challenge - Full Stack Solution

This repository contains the complete solution for the Playto Engineering Challenge, consisting of a Django REST Framework backend and a React (Vite + Tailwind) frontend.

## Directory Structure

- `backend/`: Django project with `community` app, API, and business logic.
- `frontend/`: React application with shadcn/ui components, `query` client, and interactions.

## Quick Start

### 1. Backend Setup

Prerequisites: Python 3.10+

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install django djangorestframework django-cors-headers python-dotenv
   ```

4. Configure Environment:
   Create a `.env` file in the `backend/` directory:

   ```env
   SECRET_KEY=dev-secret-key-123
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

5. Run Migrations:

   ```bash
   python manage.py migrate
   ```

6. Start the Server:
   ```bash
   python manage.py runserver
   ```
   The backend will be available at `http://127.0.0.1:8000/`.

### 2. Frontend Setup

Prerequisites: Node.js 18+

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Environment:
   Create a `.env` file in the `frontend/` directory:

   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

4. Start Development Server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000/`.

## Features Implemented

### Backend

- **Feed API**: Lists posts with like counts and author info.
- **Threaded Comments**: Optimized recursive fetch (uses 2 queries max per post regardless of depth) to avoid N+1 issues.
- **Gamification**:
  - 5 Karma for Post Likes.
  - 1 Karma for Comment Likes.
- **Leaderboard**: Calculates top users by _earned_ karma in the last 24 hours using subqueries for efficiency.
- **Concurrency**: Database constraints enforce unique likes per user/content.

### Frontend

- **Modern UI**: Built with Tailwind CSS, shadcn/ui, and Framer Motion for animations.
- **Optimistic Updates**: Likes update instantly on the UI while syncing with the server in the background.
- **Interactive Feed**: Recursively rendered comment threads.
- **Live Leaderboard**: Sidebar widget showing top users.
- **User Switcher**: Mock login system in the Navbar to test voting as different users (Alice, Bob, Charlie).

## Testing

To run the backend tests (including the N+1 compliance verification):

```bash
cd backend
python manage.py test community
```

## API Endpoints

- `GET /api/posts/`: List all posts.
- `GET /api/posts/{id}/`: Get specific post with full nested comment tree.
- `POST /api/likes/`: Like a post or comment. Body: `{ "type": "post", "id": 1 }`.
- `GET /api/leaderboard/`: Get top 5 users by karma (24h).
