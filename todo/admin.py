
from django.contrib import admin
from todo.models import Task

class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'completed', 'posted_at', 'due_at']
    search_fields = ['title', 'memo']

admin.site.register(Task, TaskAdmin)
