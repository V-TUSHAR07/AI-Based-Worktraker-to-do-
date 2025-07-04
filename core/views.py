from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from .models import Task, Category, ContextEntry
from .serializers import TaskSerializer, CategorySerializer, ContextEntrySerializer
from .ai import analyze_tasks_and_context
import datetime
from django.conf import settings
from django.http import JsonResponse, HttpResponseRedirect, HttpResponse
import os
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
import csv
import io
import json
import re

# Create your views here.

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-priority_score', 'deadline')
    serializer_class = TaskSerializer

class ContextEntryViewSet(viewsets.ModelViewSet):
    queryset = ContextEntry.objects.all().order_by('-timestamp')
    serializer_class = ContextEntrySerializer

# Placeholder for AI-powered suggestions endpoint
@api_view(['POST'])
def ai_suggestions(request):
    tasks = request.data.get('tasks', [])
    context_entries = request.data.get('context_entries', [])
    user_preferences = request.data.get('user_preferences')
    current_task_load = request.data.get('current_task_load')
    suggestions = analyze_tasks_and_context(tasks, context_entries, user_preferences, current_task_load)
    return Response({'suggestions': suggestions}, status=status.HTTP_200_OK)

@api_view(["POST"])
def suggest_schedule(request):
    """
    Suggest a deadline and priority for a new task based on recent context entries.
    Accepts optional 'context' in POST data. If not provided, uses the latest 5 context entries.
    Returns an explanation for the suggestion.
    """
    context_text = request.data.get("context")
    if not context_text:
        recent_entries = ContextEntry.objects.order_by("-timestamp")[:5]
        if not recent_entries:
            return Response({"error": "No context available."}, status=status.HTTP_400_BAD_REQUEST)
        context_text = "\n---\n".join([e.content for e in recent_entries])

    suggestion = {}
    explanation = ""
    try:
        from core.models import GEMINI_AVAILABLE, GEMINI_API_KEY
        if GEMINI_AVAILABLE and GEMINI_API_KEY:
            from google.generativeai.client import configure
            from google.generativeai.generative_models import GenerativeModel
            configure(api_key=GEMINI_API_KEY)
            model = GenerativeModel('models/gemini-1.5-flash')
            prompt = (
                f"""
                Based on the following context entries, suggest a realistic deadline (in days from now) and a priority score (0-1, where 1 is most urgent) for a new task. Also, explain your reasoning in 1-2 sentences.\n
                Context Entries:\n{context_text}\n
                Respond as JSON: {{\n  \"suggested_deadline_days\": <int>,\n  \"priority_score\": <float 0-1>,\n  \"explanation\": <string>\n}}
                """
            )
            response = model.generate_content(prompt)
            print("Gemini raw response:", response)
            print("Gemini response.text:", getattr(response, 'text', None))
            if not getattr(response, 'text', None) or not response.text.strip():
                return Response({"error": "Gemini returned an empty response. Check your API key, quota, or model access."}, status=500)
            raw = response.text.strip()
            # Remove triple backtick code block if present
            if raw.startswith('```'):
                raw = re.sub(r'^```[a-zA-Z]*\n', '', raw)  # Remove opening ```
                raw = re.sub(r'```$', '', raw)              # Remove closing ```
                raw = raw.strip()
            try:
                suggestion = json.loads(raw)
            except Exception as parse_err:
                print("Gemini response parse error:", parse_err)
                return Response({"error": f"Gemini response not valid JSON: {parse_err}. Raw: {response.text}"}, status=500)
            explanation = suggestion.get("explanation", "")
        else:
            from textblob import TextBlob
            blob = TextBlob(context_text)
            urgency = 0.5
            if blob.sentiment.polarity < -0.2:
                urgency = 0.8
                explanation = "Context seems urgent or negative."
            elif blob.sentiment.polarity > 0.2:
                urgency = 0.3
                explanation = "Context seems positive or not urgent."
            else:
                explanation = "Context is neutral."
            suggestion = {
                "suggested_deadline_days": 2 if urgency > 0.7 else 5,
                "priority_score": urgency,
                "explanation": explanation
            }
    except Exception as e:
        import traceback
        print("Suggest schedule error:", e)
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if "suggested_deadline_days" in suggestion:
        suggestion["suggested_deadline"] = (datetime.datetime.now() + datetime.timedelta(days=int(suggestion["suggested_deadline_days"])) ).isoformat()
    return Response(suggestion)

# Google Calendar integration
@api_view(["GET"])
@permission_classes([AllowAny])
def calendar_auth_url(request):
    from google_auth_oauthlib.flow import Flow
    # You must set these in your environment or settings
    CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "YOUR_CLIENT_ID")
    CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "YOUR_CLIENT_SECRET")
    REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/calendar/callback/")
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "redirect_uris": [REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=["https://www.googleapis.com/auth/calendar.events"]
    )
    flow.redirect_uri = REDIRECT_URI
    auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline', include_granted_scopes='true')
    return JsonResponse({"auth_url": auth_url})

@api_view(["GET"])
@permission_classes([AllowAny])
def calendar_callback(request):
    from google_auth_oauthlib.flow import Flow
    import pickle
    CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "YOUR_CLIENT_ID")
    CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "YOUR_CLIENT_SECRET")
    REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/calendar/callback/")
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "redirect_uris": [REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=["https://www.googleapis.com/auth/calendar.events"]
    )
    flow.redirect_uri = REDIRECT_URI
    code = request.GET.get("code")
    flow.fetch_token(code=code)
    credentials = flow.credentials
    # For demo: store in session (for prod, use DB or secure storage)
    request.session['google_credentials'] = pickle.dumps(credentials).hex()
    return HttpResponseRedirect("/")

@api_view(["POST"])
@permission_classes([AllowAny])
def calendar_add_event(request):
    import pickle
    from googleapiclient.discovery import build
    creds_hex = request.session.get('google_credentials')
    if not creds_hex:
        return JsonResponse({"error": "Not authenticated with Google."}, status=401)
    credentials = pickle.loads(bytes.fromhex(creds_hex))
    service = build('calendar', 'v3', credentials=credentials)
    data = request.data
    event = {
        'summary': data.get('title', 'Task'),
        'description': data.get('description', ''),
        'start': {
            'dateTime': data.get('start'),
            'timeZone': 'UTC',
        },
        'end': {
            'dateTime': data.get('end'),
            'timeZone': 'UTC',
        },
    }
    created_event = service.events().insert(calendarId='primary', body=event).execute()
    return JsonResponse({'event': created_event})

@api_view(["GET"])
def export_tasks(request):
    format = request.GET.get("format", "json")
    tasks = Task.objects.all()
    if format == "csv":
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="tasks.csv"'
        writer = csv.writer(response)
        writer.writerow(["id", "title", "description", "priority_score", "deadline", "status", "category_id"])
        for t in tasks:
            writer.writerow([
                t.id, t.title, t.description, t.priority_score, t.deadline, t.status, t.category.id if t.category else ''
            ])
        return response
    else:
        data = TaskSerializer(tasks, many=True).data
        return HttpResponse(json.dumps(data), content_type='application/json')

@api_view(["POST"])
def import_tasks(request):
    format = request.GET.get("format", "json")
    if format == "csv":
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded."}, status=400)
        decoded = file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))
        created = 0
        for row in reader:
            Task.objects.create(
                title=row['title'],
                description=row.get('description', ''),
                priority_score=float(row.get('priority_score', 0)),
                deadline=row.get('deadline') or None,
                status=row.get('status', 'pending'),
                category=Category.objects.filter(id=row.get('category_id')).first() if row.get('category_id') else None
            )
            created += 1
        return Response({"created": created})
    else:
        try:
            data = json.loads(request.body)
            created = 0
            for item in data:
                Task.objects.create(
                    title=item['title'],
                    description=item.get('description', ''),
                    priority_score=float(item.get('priority_score', 0)),
                    deadline=item.get('deadline') or None,
                    status=item.get('status', 'pending'),
                    category=Category.objects.filter(id=item.get('category', {}).get('id')).first() if item.get('category') else None
                )
                created += 1
            return Response({"created": created})
        except Exception as e:
            return Response({"error": str(e)}, status=400)
