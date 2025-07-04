"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateTask, fetchCategories } from "@/lib/api";
import { toast } from "sonner";

type EditTaskModalProps = {
  task: any;
  onTaskUpdated: () => void;
  children?: React.ReactNode;
};

export function EditTaskModal({ task, onTaskUpdated, children }: EditTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [categoryId, setCategoryId] = useState(task.category?.id || "");
  const [deadline, setDeadline] = useState(task.deadline ? task.deadline.slice(0, 10) : "");
  const [status, setStatus] = useState(task.status);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && categories.length === 0) {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (err: any) {
        setError("Failed to load categories");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateTask(task.id, {
        title,
        description,
        category_id: categoryId || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        status,
      });
      setOpen(false);
      onTaskUpdated();
      toast.info("Task updated successfully!");
    } catch (err: any) {
      setError(err.message);
      toast.info("Failed to update task: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ? (
          <Button variant="outline">{children}</Button>
        ) : (
          <Button variant="outline">Edit</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <Input
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <select
            className="border rounded px-2 py-1"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <Input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />
          <select
            className="border rounded px-2 py-1"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </form>
      </DialogContent>
    </Dialog>
  );
} 