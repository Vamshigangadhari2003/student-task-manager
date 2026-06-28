const API_BASE_URL = 'http://localhost:8080/api/tasks';

let currentFilter = 'ALL';

window.onload = function() {
    loadTasks();
};

async function loadTasks() {
    try {
        let url = API_BASE_URL;
        if (currentFilter !== 'ALL') {
            url = `${API_BASE_URL}/status/${currentFilter}`;
        }
        const response = await fetch(url);
        const tasks = await response.json();
        displayTasks(tasks);
    } catch (error) {
        showError('Failed to connect to server. Make sure Spring Boot is running.');
    }
}

function displayTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="empty-msg">No tasks found. Add your first task!</div>';
        return;
    }

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card priority-${task.priority} ${task.status === 'COMPLETED' ? 'completed' : ''}`;
        card.innerHTML = `
            <div class="task-info">
                <h3 class="${task.status === 'COMPLETED' ? 'done' : ''}">${task.title}</h3>
                <p>${task.description || 'No description'}</p>
                <div class="task-meta">
                    <span class="badge badge-${task.priority}">${task.priority}</span>
                    <span class="badge badge-${task.status}">${task.status}</span>
                    ${task.dueDate ? `<span class="due-date">📅 ${task.dueDate}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                ${task.status === 'PENDING' ?
                    `<button class="btn btn-complete" onclick="completeTask(${task.id})">✓ Done</button>`
                    : ''}
                <button class="btn btn-delete" onclick="deleteTask(${task.id})">🗑 Delete</button>
            </div>
        `;
        taskList.appendChild(card);
    });
}

async function createTask() {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const priority = document.getElementById('priority').value;
    const dueDate = document.getElementById('dueDate').value;

    if (!title || !priority) {
        showError('Title and Priority are required!');
        return;
    }

    const task = { title, description, priority, dueDate: dueDate || null };

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });

        if (response.ok) {
            clearForm();
            showError('');
            loadTasks();
        } else {
            const error = await response.json();
            showError(Object.values(error).join(', '));
        }
    } catch (error) {
        showError('Failed to create task. Make sure Spring Boot is running.');
    }
}

async function completeTask(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        const task = await response.json();

        const updatedTask = {
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            status: 'COMPLETED',
            dueDate: task.dueDate || null
        };

        await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTask)
        });
        loadTasks();
    } catch (error) {
        showError('Failed to update task.');
    }
}

async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
        loadTasks();
    } catch (error) {
        showError('Failed to delete task.');
    }
}

function filterTasks(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadTasks();
}

function clearForm() {
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('priority').value = '';
    document.getElementById('dueDate').value = '';
}

function showError(msg) {
    document.getElementById('error-msg').textContent = msg;
}