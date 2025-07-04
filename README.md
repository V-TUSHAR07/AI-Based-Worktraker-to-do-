# Smart Todo App with AI Features

## Overview
A modern, full-stack Smart Todo app with advanced AI features, import/export, Google Calendar integration, and a beautiful, responsive UI. Built with Django (backend) and Next.js/React (frontend).

## Features
- **Add, edit, delete, and categorize tasks**
- **AI-powered suggestions** for task priority and deadlines (using Google Gemini API)
- **Context analysis** (sentiment, keywords, action items, intent, summary) for notes, emails, WhatsApp, etc.
- **Import/export tasks** as CSV or JSON
- **Google Calendar integration** (add tasks as events)
- **Modern, glassmorphic UI** with responsive design
- **Clear error handling and user feedback**

## How It Works
- **Dashboard**: View, add, edit, and delete tasks. Use the "Suggest" button for AI-powered scheduling.
- **Context Page**: Add context entries (notes, emails, WhatsApp, etc.) and see AI analysis for each entry.
- **Import/Export**: Easily move your tasks in/out as CSV or JSON.
- **Google Calendar**: (If enabled) Sync tasks to your Google Calendar.

## Screenshots of the UI

### Dashboard View
![Dashboard view](./screenshot-2025-07-05-00-25-35.png)

### Add Task Modal
![Add Task Modal](./screenshot-2025-07-05-00-25-46.png)

### JSON Error Example (Django API UI)
![JSON error example](./screenshot-2025-07-04-20-49-09.png)

### AI Suggestion for Task
![AI suggestion for task](./screenshot-2025-07-05-00-35-32.png)

### Context History Example 1
![Context history 1](./screenshot-2025-07-05-00-37-46.png)

### Context History Example 2
![Context history 2](./screenshot-2025-07-05-00-38-39.png)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <project-folder>

```

### 2. Backend Setup (Django)
- **Python 3.10+ recommended**
- Create a virtual environment:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```
- Install dependencies:
  ```bash
  pip install -r requirements.txt
  python -m textblob.download_corpora  # For fallback AI
  ```
- **Set up your Gemini API key** (Google Generative AI):
  - Get your key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  - In `core/models.py`, set:
    ```python
    GEMINI_AVAILABLE = True
    GEMINI_API_KEY = "<your-gemini-api-key>"
    ```
  - **Do NOT commit your real key to public repos!**
- Run migrations:
  ```bash
  python manage.py migrate
  ```
- Start the backend:
  ```bash
  python manage.py runserver
  ```

### 3. Frontend Setup (Next.js/React)
- Go to the frontend folder:
  ```bash
  cd frontend
  npm install
  # or
  yarn install
  ```
- Set the API base URL if needed (in `.env.local`):
  ```env
  NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
  ```
- Start the frontend:
  ```bash
  npm run dev
  # or
  yarn dev
  ```

### 4. Using the App
- Open [http://localhost:3000](http://localhost:3000) for the frontend.
- Open [http://localhost:8000/api/](http://localhost:8000/api/) for the backend API (Django REST Framework UI).

## API Documentation

### Task Endpoints
- **List tasks:** `GET /api/tasks/`
- **Create task:** `POST /api/tasks/`
  - Example body:
    ```json
    {
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "priority_score": 0.7,
      "deadline": "2025-07-10T12:00:00Z",
      "status": "pending",
      "category_id": 1
    }
    ```
- **Edit task:** `PUT /api/tasks/{id}/`
- **Delete task:** `DELETE /api/tasks/{id}/`

### Context Entry Endpoints
- **List context entries:** `GET /api/context/`
- **Create context entry:** `POST /api/context/`
  - Example body:
    ```json
    {
      "content": "Follow up with client about proposal.",
      "source_type": "email"
    }
    ```
- **Edit context entry:** `PUT /api/context/{id}/`
- **Delete context entry:** `DELETE /api/context/{id}/`

### AI Suggestion Endpoints
- **Task suggestions:** `POST /api/ai-suggestions/`
  - Example body:
    ```json
    {
      "tasks": [{"id": 1, "title": "Finish report", "description": "Due soon"}],
      "context_entries": [{"content": "Report is urgent", "source_type": "note"}]
    }
    ```
- **Schedule suggestion:** `POST /api/suggest-schedule/`
  - Example body:
    ```json
    { "context": "Finish the quarterly report by Friday." }
    ```
  - Example response:
    ```json
    {
      "suggested_deadline_days": 2,
      "priority_score": 0.8,
      "explanation": "Context seems urgent or negative.",
      "suggested_deadline": "2025-07-07T12:00:00Z"
    }
    ```

## Sample Tasks and AI Suggestions

### Example Task
```json
{
  "title": "on-chain project",
  "description": "based on blockchain",
  "category": "Work",
  "deadline": "2025-07-06T00:00:00Z",
  "status": "in_progress"
}
```

### Example AI Suggestion
```json
{
  "suggested_deadline_days": 1,
  "priority_score": 0.7,
  "explanation": "Based on your description, this task seems moderately urgent. The suggested deadline is very soon, so this task is important.",
  "suggested_deadline": "2025-07-06T00:00:00Z"
}
```

## Security Note
- **Never commit your real API keys to public repositories!**
- For production, use environment variables or a secrets manager for your keys.

If you have any issues, check the logs or open an issue in the repository!
