"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createTask, fetchCategories, suggestSchedule } from "@/lib/api";
import { toast } from "sonner";

type AddTaskModalProps = {
  onTaskAdded: () => void;
  categoriesProp?: any[];
};

export function AddTaskModal({ onTaskAdded, categoriesProp }: AddTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("pending");
  const [categories, setCategories] = useState<any[]>(categoriesProp || []);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prioritySuggestion, setPrioritySuggestion] = useState<number | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestExplanation, setSuggestExplanation] = useState<string | null>(null);

  // Always fetch categories when modal opens
  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setCatLoading(true);
      setCatError(null);
      try {
        const cats = categoriesProp || await fetchCategories();
        setCategories(cats);
      } catch (err: any) {
        setCatError("Failed to load categories");
      } finally {
        setCatLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createTask({
        title,
        description,
        category_id: categoryId || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        status,
      });
      setTitle("");
      setDescription("");
      setCategoryId("");
      setDeadline("");
      setStatus("pending");
      setOpen(false);
      onTaskAdded();
      toast.info("Task added successfully!");
    } catch (err: any) {
      setError(err.message);
      toast.info("Failed to add task: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = async () => {
    setSuggestLoading(true);
    setSuggestError(null);
    try {
      const suggestion = await suggestSchedule(description);
      if (suggestion.suggested_deadline) {
        setDeadline(suggestion.suggested_deadline.slice(0, 10)); // yyyy-mm-dd
      }
      if (typeof suggestion.priority_score === "number") {
        setPrioritySuggestion(suggestion.priority_score);
      }
      setSuggestExplanation(suggestion.explanation || null);
      toast.info("AI suggestion applied!");
    } catch (err: any) {
      let msg = err.message;
      if (msg && msg.toLowerCase().includes("no context available")) {
        msg = "Please add some context entries first!";
      }
      setSuggestError(msg);
      toast.info("Failed to get suggestion: " + msg);
    } finally {
      setSuggestLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Add Task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
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
          <Button type="button" variant="outline" onClick={handleSuggest} disabled={suggestLoading} className="w-fit self-end">{suggestLoading ? "Suggesting..." : "Suggest"}</Button>
          {/*
            AI Suggestion Display:
            Shows a user-friendly explanation of the AI's priority suggestion and reasoning.
            If the suggested deadline is within 2 days, the task is important; otherwise, it is not that important.
          */}
          {prioritySuggestion !== null && (
            <div className="text-sm text-purple-800 font-medium flex flex-col gap-1 mt-1">
              <span>
                <strong>AI Suggestion:</strong> {(() => {
                  let urgencyMsg = "";
                  if (prioritySuggestion >= 0.7) urgencyMsg = "this task seems urgent";
                  else if (prioritySuggestion <= 0.3) urgencyMsg = "this task does not seem urgent";
                  else urgencyMsg = "this task seems moderately urgent";
                  let deadlineMsg = "";
                  if (deadline) {
                    const dateObj = new Date(deadline);
                    const today = new Date();
                    const diffDays = Math.ceil((dateObj.getTime() - today.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 2) {
                      deadlineMsg = " The suggested deadline is very soon, so this task is important.";
                    } else {
                      deadlineMsg = " The suggested deadline is not very soon, so this task is not that important.";
                    }
                    deadlineMsg += ` (Suggested deadline: ${dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })})`;
                  }
                  return `Based on your description, ${urgencyMsg}.${deadlineMsg}`;
                })()}
              </span>
              {suggestExplanation && (
                <span className="text-xs text-gray-600 italic">{suggestExplanation}</span>
              )}
            </div>
          )}
          {suggestError && <div className="text-red-500 text-xs">{suggestError}</div>}
          <select
            className="border rounded px-2 py-1"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            disabled={catLoading}
          >
            <option value="">Select Category</option>
            {catLoading && <option>Loading...</option>}
            {catError && <option disabled>{catError}</option>}
            {!catLoading && !catError && categories.map(cat => (
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
          <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Task"}</Button>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </form>
      </DialogContent>
    </Dialog>
  );
} 