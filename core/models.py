from django.db import models
from textblob import TextBlob
import os

GEMINI_AVAILABLE = True
GEMINI_API_KEY = "put ur api key here"

# Create your models here.

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    usage_frequency = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name

class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    priority_score = models.FloatField(default=0.0)
    deadline = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class ContextEntry(models.Model):
    SOURCE_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('email', 'Email'),
        ('note', 'Note'),
    ]
    content = models.TextField()
    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    processed_insights = models.JSONField(null=True, blank=True)

    def save(self, *args, **kwargs):
        insights = None
        # Force use of TextBlob (free fallback)
        blob = TextBlob(self.content)
        sentiment = blob.sentiment.polarity
        keywords = list(blob.noun_phrases)
        # Simple heuristics for fallback
        action_items = [phrase for phrase in keywords if any(word in phrase.lower() for word in ["call", "email", "meet", "schedule", "remind", "send"])]
        intent = "reminder" if "remind" in self.content.lower() else "info"
        summary = str(blob.sentences[0]) if blob.sentences else self.content[:60]
        insights = {
            "sentiment": sentiment,
            "keywords": keywords,
            "action_items": action_items,
            "intent": intent,
            "summary": summary
        }
        self.processed_insights = insights
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.source_type} - {self.timestamp}"
