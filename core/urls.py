from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, CategoryViewSet, ContextEntryViewSet, ai_suggestions
from core import views

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'context', ContextEntryViewSet, basename='contextentry')

urlpatterns = [
    path('api/tasks/export/', views.export_tasks, name='export_tasks'),
    path('api/tasks/import/', views.import_tasks, name='import_tasks'),
    path('api/', include(router.urls)),
    path('api/ai-suggestions/', ai_suggestions, name='ai-suggestions'),
    path('api/suggest-schedule/', views.suggest_schedule, name='suggest_schedule'),
    path('api/calendar/auth-url/', views.calendar_auth_url, name='calendar_auth_url'),
    path('api/calendar/callback/', views.calendar_callback, name='calendar_callback'),
    path('api/calendar/add-event/', views.calendar_add_event, name='calendar_add_event'),
] 