const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export async function fetchTasks() {
  const res = await fetch(`${baseUrl}/tasks/`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${baseUrl}/categories/`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function fetchContextEntries() {
  const res = await fetch(`${baseUrl}/context/`);
  if (!res.ok) throw new Error('Failed to fetch context entries');
  return res.json();
}

export async function createTask(data: any) {
  const res = await fetch(`${baseUrl}/tasks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function createContextEntry(data: any) {
  // Always send processed_insights as null unless explicitly provided
  const payload = { ...data, processed_insights: data.processed_insights ?? null };
  const res = await fetch(`${baseUrl}/context/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create context entry');
  return res.json();
}

export async function updateTask(id: number, data: any) {
  const res = await fetch(`${baseUrl}/tasks/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(id: number) {
  const res = await fetch(`${baseUrl}/tasks/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete task');
  return true;
}

export async function updateContextEntry(id: number, data: any) {
  const res = await fetch(`${baseUrl}/context/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update context entry');
  return res.json();
}

export async function deleteContextEntry(id: number) {
  const res = await fetch(`${baseUrl}/context/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete context entry');
  return true;
}

export async function suggestSchedule(context?: string) {
  const res = await fetch(`${baseUrl}/suggest-schedule/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context ? { context } : {}),
  });
  if (!res.ok) throw new Error('Failed to get schedule suggestion');
  return res.json();
}

export async function exportTasks(format: 'json' | 'csv' = 'json') {
  const res = await fetch(`${baseUrl}/tasks/export/?format=${format}`);
  if (!res.ok) throw new Error('Failed to export tasks');
  if (format === 'csv') return res.text();
  return res.json();
}

export async function importTasks(data: File | any[], format: 'json' | 'csv' = 'json') {
  if (format === 'csv') {
    if (!(data instanceof File)) throw new Error('CSV import requires a File');
    const formData = new FormData();
    formData.append('file', data);
    const res = await fetch(`${baseUrl}/tasks/import/?format=csv`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to import tasks');
    return res.json();
  } else {
    const res = await fetch(`${baseUrl}/tasks/import/?format=json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to import tasks');
    return res.json();
  }
} 