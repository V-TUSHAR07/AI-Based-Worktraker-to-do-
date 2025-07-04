import os
import random
from datetime import datetime, timedelta

from core.models import GEMINI_AVAILABLE, GEMINI_API_KEY

from google.generativeai.client import configure
from google.generativeai.generative_models import GenerativeModel

def analyze_tasks_and_context(tasks, context_entries, user_preferences=None, current_task_load=None):
    if GEMINI_AVAILABLE and GEMINI_API_KEY:
        try:
            configure(api_key=GEMINI_API_KEY)
            model = GenerativeModel('models/gemini-1.5-flash')
            # Build prompt
            prompt = build_gemini_prompt(tasks, context_entries, user_preferences, current_task_load)
            response = model.generate_content(prompt)
            import json
            suggestions = json.loads(response.text)
            return suggestions
        except Exception as e:
            return [{"error": f"Gemini API error: {str(e)}"}]
    else:
        # Fallback to local mock AI logic
        return mock_ai_suggestions(tasks, context_entries)

def build_gemini_prompt(tasks, context_entries, user_preferences, current_task_load):
    prompt = """
You are an intelligent task assistant. Given the following tasks and daily context, provide for each task:
- priority_score (0-1, higher is more urgent)
- suggested_deadline (ISO format)
- suggested_category (string)
- enhanced_description (string, context-aware)
Return a JSON array, one object per task, with keys: task_id, priority_score, suggested_deadline, suggested_category, enhanced_description.

Tasks:
"""
    for task in tasks:
        prompt += f"- id: {task.get('id')}, title: {task.get('title')}, description: {task.get('description')}\n"
    prompt += "\nContext Entries:\n"
    for entry in context_entries:
        prompt += f"- {entry.get('source_type')}: {entry.get('content')}\n"
    if user_preferences:
        prompt += f"\nUser Preferences: {user_preferences}\n"
    if current_task_load:
        prompt += f"\nCurrent Task Load: {current_task_load}\n"
    prompt += "\nRespond ONLY with a JSON array as described."
    return prompt

def mock_ai_suggestions(tasks, context_entries):
    """
    Fallback AI suggestion logic using random and context length.
    This is used if Gemini is not available or fails.
    """
    suggestions = []
    for task in tasks:
        priority_score = random.uniform(0, 1) + len(context_entries) * 0.1
        deadline = (datetime.now() + timedelta(days=random.randint(1, 7))).isoformat()
        suggested_category = 'Work' if 'work' in task.get('title', '').lower() else 'Personal'
        enhanced_description = task.get('description', '') + ' (AI-enhanced)'
        suggestions.append({
            'task_id': task.get('id'),
            'priority_score': round(priority_score, 2),
            'suggested_deadline': deadline,
            'suggested_category': suggested_category,
            'enhanced_description': enhanced_description,
        })
    return suggestions 