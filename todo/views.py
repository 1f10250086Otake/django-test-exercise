from django.shortcuts import render, redirect
from django.http import Http404
from django.utils.timezone import make_aware
from django.utils.dateparse import parse_datetime
from todo.models import Task


# Create your views here.
def index(request):
    if request.method == 'POST':
        task = Task(title=request.POST['title'], memo=request.POST.get('memo', ''), due_at=make_aware(parse_datetime(request.POST['due_at'])))
        task.save()

    query = request.GET.get('q', '').strip()
    tasks = Task.objects.all()

    if query:
        tasks = tasks.filter(title__icontains=query)

    if request.GET.get('order') == 'due':
        tasks = tasks.order_by('due_at')
    else:
        tasks = tasks.order_by('-posted_at')

    context = {
        'tasks': tasks,
        'query': query,
    }
    return render(request, 'todo/index.html', context)

def detail(request, task_id):
    try:
        task = Task.objects.get(pk=task_id)
    except Task. DoesNotExist:
        raise Http404("Task does not exist")

    context = {
        'task': task,
    }
    return render(request, 'todo/detail.html', context)

def delete(request, task_id):
    try:
        task = Task.objects.get(pk=task_id)
    except Task.DoesNotExist:
        raise Http404("Task does not exist")
    
    task.delete()
    return redirect('index')

def close(request, task_id):
    try:
        task = Task.objects.get(pk=task_id)
    except Task.DoesNotExist:
        raise Http404("Task does not exist")
    task.completed = True
    task.save()
    return redirect(index)

def edit(request, task_id):
    try:
        task = Task.objects.get(pk=task_id)
    except Task.DoesNotExist:
        raise Http404("Task does not exist")

    if request.method == 'POST':
        task.title = request.POST['title']
        task.memo = request.POST.get('memo', '')
        if request.POST['due_at']:
            task.due_at = make_aware(parse_datetime(request.POST['due_at']))
        else:
            task.due_at = None
        task.completed = 'completed' in request.POST
        task.save()
        return redirect('detail', task_id=task.id)

    context = {
        'task': task,
    }
    return render(request, 'todo/edit.html', context)
