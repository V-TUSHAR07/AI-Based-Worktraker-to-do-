"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchTasks, deleteTask, fetchCategories, importTasks } from "@/lib/api";
import { AddTaskModal } from "@/components/AddTaskModal";
import { EditTaskModal } from "@/components/EditTaskModal";
import { toast } from "sonner";

type Task = {
  id: number;
  title: string;
  description: string;
  priority_score: number;
  deadline: string | null;
  status: string;
  category?: { id: number; name: string } | null;
};

type Category = { id: number; name: string };

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("priority");

  const loadTasks = () => {
    setLoading(true);
    fetchTasks()
      .then((data) => setTasks(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
    fetchCategories().then(setCategories);
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(id);
      loadTasks();
      toast.info("Task deleted!");
    } catch (err: any) {
      toast.info("Failed to delete task: " + err.message);
    }
  };

  // Filtering and sorting
  let filteredTasks = tasks;
  if (filterCategory) filteredTasks = filteredTasks.filter(t => String(t.category?.id ?? '') === filterCategory);
  if (filterStatus) filteredTasks = filteredTasks.filter(t => t.status === filterStatus);
  if (sortBy === "priority") filteredTasks = [...filteredTasks].sort((a, b) => b.priority_score - a.priority_score);
  if (sortBy === "deadline") filteredTasks = [...filteredTasks].sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
  if (sortBy === "category") filteredTasks = [...filteredTasks].sort((a, b) => {
    const aCat = a.category?.name?.toLowerCase() || '';
    const bCat = b.category?.name?.toLowerCase() || '';
    return aCat.localeCompare(bCat);
  });
  if (sortBy === "day") filteredTasks = [...filteredTasks].sort((a, b) => {
    // Sort by day of week (Monday=0, Sunday=6)
    const getDay = (d: string | null) => d ? new Date(d).getDay() : 7;
    return getDay(a.deadline) - getDay(b.deadline);
  });

  // Pure-frontend export handlers
  const handleExport = (format: 'json' | 'csv') => {
    if (format === 'csv') {
      const headers = ['id', 'title', 'description', 'priority_score', 'deadline', 'status', 'category_id', 'category_name'];
      const rows = tasks.map(t => [
        t.id,
        t.title,
        t.description,
        t.priority_score,
        t.deadline,
        t.status,
        t.category?.id ?? '',
        t.category?.name ?? ''
      ]);
      const csv = [headers, ...rows].map(row => row.map(String).map(s => '"' + s.replace(/"/g, '""') + '"').join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tasks.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tasks.json';
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.info('Tasks exported!');
  };

  // Import handlers
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>, format: 'json' | 'csv') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (format === 'csv') {
        await importTasks(file, 'csv');
      } else {
        const text = await file.text();
        const data = JSON.parse(text);
        await importTasks(data, 'json');
      }
      toast.info('Tasks imported!');
      loadTasks();
    } catch (err: any) {
      toast.info('Failed to import tasks: ' + err.message);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 p-2 sm:p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto bg-white/60 backdrop-blur-xl shadow-2xl rounded-3xl p-4 sm:p-8 animate-fadein">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center text-purple-900 mb-8">Smart Todo Dashboard</h1>
        <div className="mb-6 flex flex-wrap gap-3 items-center justify-center">
          <AddTaskModal onTaskAdded={loadTasks} categoriesProp={categories} />
          <Button onClick={() => handleExport('csv')} className="bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-md px-6 py-2 transition-all duration-200 hover:scale-105 active:scale-95">Export CSV</Button>
          <Button onClick={() => handleExport('json')} className="bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-md px-6 py-2 transition-all duration-200 hover:scale-105 active:scale-95">Export JSON</Button>
          <label className="inline-block">
            <span className="sr-only">Import CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={e => handleImport(e, 'csv')} />
            <Button asChild className="bg-purple-100 text-purple-700 border-none rounded-full shadow px-6 py-2 transition-all duration-200 hover:bg-purple-200 hover:scale-105 active:scale-95">Import CSV</Button>
          </label>
          <label className="inline-block">
            <span className="sr-only">Import JSON</span>
            <input type="file" accept=".json" className="hidden" onChange={e => handleImport(e, 'json')} />
            <Button asChild className="bg-purple-100 text-purple-700 border-none rounded-full shadow px-6 py-2 transition-all duration-200 hover:bg-purple-200 hover:scale-105 active:scale-95">Import JSON</Button>
          </label>
        </div>
        <div className="mb-8 flex flex-wrap gap-3 items-center justify-center">
          <select
            className="rounded-full bg-purple-50 px-4 py-2 text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-purple-300 border-none outline-none"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            className="rounded-full bg-purple-50 px-4 py-2 text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-purple-300 border-none outline-none"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            className="rounded-full bg-purple-50 px-4 py-2 text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-purple-300 border-none outline-none"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="priority">Sort by Priority</option>
            <option value="deadline">Sort by Deadline</option>
            <option value="category">Sort by Category</option>
            <option value="day">Sort by Day</option>
          </select>
        </div>
        <section className="bg-white/60 backdrop-blur shadow-xl rounded-2xl p-4 sm:p-6 border-none animate-fadein">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-purple-800 text-center">Tasks</h2>
          {loading && <div className="text-purple-400">Loading tasks...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {!loading && !error && filteredTasks.length === 0 && (
            <div className="text-purple-400">No tasks yet.</div>
          )}
          {!loading && !error && filteredTasks.length > 0 && (
            <ul className="divide-y divide-purple-200">
              {filteredTasks.map((task) => (
                <li key={task.id} className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-semibold text-base text-purple-900">{task.title}</span>
                    <span className="ml-2 text-xs text-purple-500">[{task.status}]</span>
                    <div className="text-sm text-purple-800 mt-1 break-words">{task.description}</div>
                    {task.category && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full font-semibold bg-purple-200 text-purple-900">
                        {task.category.name}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row items-end sm:items-center">
                    <span className="text-xs text-purple-700">Priority: {task.priority_score}</span>
                    {task.deadline && (
                      <span className="text-xs text-purple-700">Due: {task.deadline}</span>
                    )}
                    <EditTaskModal task={task} onTaskUpdated={loadTasks} />
                    <Button variant="destructive" className="rounded-full shadow px-5 py-2 transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => handleDelete(task.id)}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
