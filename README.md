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
![Dashboard view](frontend/public/screenshot-2025-07-05-00-25-35.png)

### Add Task Modal
![Add Task Modal](frontend/public/screenshot-2025-07-05-00-25-46.png)

### JSON Error Example (Django API UI)
![JSON error example](frontend/public/screenshot-2025-07-04-20-49-09.png)

### AI Suggestion for Task
![AI suggestion for task](frontend/public/screenshot-2025-07-05-00-35-32.png)

### Context History Example 1
![Context history 1](frontend/public/screenshot-2025-07-05-00-37-46.png)

### Context History Example 2
![Context history 2](frontend/public/screenshot-2025-07-05-00-38-39.png)

## Prerequisites
- **Python 3.10+** (recommended)
- **Node.js 18+** and npm/yarn
- **PostgreSQL** Supabase
- **Google Gemini API key** (for AI features)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <project-folder>
```

### 2. Backend Setup (Django)

#### Create and Activate Virtual Environment
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

#### Install Python Dependencies
```bash
# Install all required packages
pip install -r requirements.txt
```

#### Configure Environment Variables
Create a `.env` file in the root directory:
```bash
# Database Configuration (if using local PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Django Secret Key (generate a new one for production)
SECRET_KEY=your-secret-key-here

# Gemini API Key (for AI features)
GEMINI_API_KEY=your-gemini-api-key-here
```

#### Set up Gemini API Key
1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env` file or set it in `core/models.py`:
   ```python
   GEMINI_AVAILABLE = True
   GEMINI_API_KEY = "your-api-key-here"
   ```
   **⚠️ Never commit your real API key to public repositories!**

#### Database Setup
The project is configured to use Supabase PostgreSQL. If you want to use a local database:
1. Update `DATABASES` in `smarttodo/settings.py`
2. Run migrations:
   ```bash
   python manage.py migrate
   ```

#### Start the Backend Server
```bash
python manage.py runserver
```
The Django backend will be available at `http://localhost:8000`

### 3. Frontend Setup (Next.js/React)

#### Navigate to Frontend Directory
```bash
cd frontend
```

#### Install Node.js Dependencies
```bash
npm install
# or
yarn install
```

#### Configure Environment Variables (Optional)
Create `.env.local` in the frontend directory:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

#### Start the Frontend Development Server
```bash
npm run dev
# or
yarn dev
```
The frontend will be available at `http://localhost:3000`

### 4. Using the App
- **Frontend**: Open [http://localhost:3000](http://localhost:3000)
- **Backend API**: Open [http://localhost:8000/api/](http://localhost:8000/api/) (Django REST Framework UI)

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

## Development

### Running Tests
```bash
# Backend tests
python manage.py test

# Frontend tests
cd frontend
npm test
```

### Code Quality
```bash
# Backend linting
pip install flake8
flake8 .

# Frontend linting
cd frontend
npm run lint
```

## Deployment

### Backend Deployment
1. Set `DEBUG = False` in `smarttodo/settings.py`
2. Configure production database
3. Set up environment variables
4. Use Gunicorn for production:
   ```bash
   gunicorn smarttodo.wsgi:application
   ```

### Frontend Deployment
1. Build the production version:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy to Vercel, Netlify, or your preferred hosting service

## Security Notes
- **Never commit API keys or secrets to public repositories!**
- Use environment variables for sensitive configuration
- Set up proper CORS settings for production
- Use HTTPS in production
- Regularly update dependencies

## Troubleshooting

### Common Issues
1. **Virtual Environment**: Always activate the virtual environment before running Django commands
2. **Database Connection**: Ensure your PostgreSQL database is running and accessible
3. **API Key**: Verify your Gemini API key is correctly set
4. **Port Conflicts**: Make sure ports 3000 (frontend) and 8000 (backend) are available

### Getting Help
If you encounter issues:
1. Check the console logs for error messages
2. Verify all dependencies are installed correctly
3. Ensure your environment variables are set properly
4. Open an issue in the repository with detailed error information

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License
This project is licensed under the MIT License - see the LICENSE file for details.
