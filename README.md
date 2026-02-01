# Playto Engineering Challenge - Backend

This is the backend for the Playto Community Feed engineering challenge. It is built with Django and Django REST Framework.

## Features implemented

- **Feed API**: Lists posts with like counts.
- **Threaded Comments**: Efficiently fetches nested comments avoiding N+1 queries.
- **Gamification**: Karma system (5 points for Post like, 1 point for Comment like).
- **Leaderboard**: Rolling 24-hour leaderboard based on _earned_ karma.
- **Concurrency**: Prevents double likes and handles race conditions via DB constraints.

## Setup

1. **Install dependencies**:

   ```bash
   pip install django djangorestframework
   ```

   (Note: Virtual environment is assumed to be active)

2. **Run Migrations**:

   ```bash
   python manage.py migrate
   ```

3. **Run Server**:
   ```bash
   python manage.py runserver
   ```

## Running Tests

One meaningful test case for Leaderboard and N+1 compliance is included.

```bash
python manage.py test community
```

## API Endpoints

- `GET /api/posts/`: List posts
- `GET /api/posts/{id}/`: Get post details with threaded comments
- `POST /api/likes/`: Like a post or comment (`{ type: "post"|"comment", id: 123 }`)
- `GET /api/leaderboard/`: Top 5 users by karma earned in last 24h.
