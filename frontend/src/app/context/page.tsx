"use client";
import { useEffect, useState } from "react";
import { fetchContextEntries, createContextEntry, updateContextEntry, deleteContextEntry } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ClientDate from "@/components/ClientDate";

export default function ContextPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [sourceType, setSourceType] = useState("note");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    fetchContextEntries()
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const entry = await createContextEntry({ content, source_type: sourceType });
      setEntries([entry, ...entries]);
      setContent("");
      setSourceType("note");
      toast.info("Context entry added!");
    } catch (err: any) {
      setError(err.message);
      toast.info("Failed to add context entry: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(entry: any) {
    setEditId(entry.id);
    setEditContent(entry.content);
  }

  function cancelEdit() {
    setEditId(null);
    setEditContent("");
  }

  async function handleEditSave(entry: any) {
    try {
      const updated = await updateContextEntry(entry.id, { ...entry, content: editContent });
      setEntries(entries.map(e => e.id === entry.id ? updated : e));
      setEditId(null);
      setEditContent("");
      toast.info("Context entry updated!");
    } catch (err: any) {
      toast.info("Failed to update context entry: " + err.message);
    }
  }

  async function handleDelete(entry: any) {
    if (!window.confirm("Are you sure you want to delete this context entry?")) return;
    try {
      await deleteContextEntry(entry.id);
      setEntries(entries.filter(e => e.id !== entry.id));
      toast.info("Context entry deleted!");
    } catch (err: any) {
      toast.info("Failed to delete context entry: " + err.message);
    }
  }

  return (
    <main className="min-h-screen bg-blue-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl w-full mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-blue-900 text-center">Context Input & History</h1>
        <form onSubmit={handleSubmit} className="mb-6 sm:mb-8 bg-white p-3 sm:p-4 rounded-xl border border-blue-200 shadow flex flex-col gap-2 sm:gap-3">
          <textarea
            className="border rounded px-2 py-2 min-h-[60px] bg-blue-50 text-sm sm:text-base"
            placeholder="Enter context (message, email, note)"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
          <select
            className="border rounded px-2 py-1 bg-white text-sm sm:text-base"
            value={sourceType}
            onChange={e => setSourceType(e.target.value)}
          >
            <option value="note">Note</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <Button type="submit" disabled={submitting} className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto">{submitting ? "Adding..." : "Add Context"}</Button>
        </form>
        <section className="bg-blue-100 rounded-xl border border-blue-200 shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-blue-800 text-center">Context History</h2>
          {loading && <div className="text-blue-400">Loading...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {!loading && entries.length === 0 && <div className="text-blue-400">No context entries yet.</div>}
          <ul className="divide-y divide-blue-200">
            {entries.map(entry => (
              <li key={entry.id} className="py-3 sm:py-4">
                {editId === entry.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="border rounded px-2 py-1 min-h-[40px] bg-blue-50 text-sm sm:text-base"
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" onClick={() => handleEditSave(entry)} className="bg-blue-500 hover:bg-blue-600 text-white">Save</Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-blue-900 font-medium break-words">{entry.content}</div>
                    <div className="text-xs text-blue-700 mb-1">{entry.source_type} | <ClientDate dateString={entry.timestamp} /></div>
                    {/* AI Analysis Display */}
                    {entry.processed_insights && (
                      <div className="mt-2 p-2 bg-white rounded text-xs text-blue-900 border border-blue-100">
                        <div className="font-semibold text-blue-700 mb-1">AI Analysis:</div>
                        {entry.processed_insights.error ? (
                          <div className="text-red-500">Error: {entry.processed_insights.error}</div>
                        ) : (
                          <>
                            {entry.processed_insights.summary && (
                              <div><span className="font-semibold">Summary:</span> {entry.processed_insights.summary}</div>
                            )}
                            {entry.processed_insights.intent && (
                              <div><span className="font-semibold">Intent:</span> {entry.processed_insights.intent}</div>
                            )}
                            {entry.processed_insights.action_items && entry.processed_insights.action_items.length > 0 && (
                              <div><span className="font-semibold">Action Items:</span> <span className="font-mono">{entry.processed_insights.action_items.join(', ')}</span></div>
                            )}
                            {entry.processed_insights.sentiment && (
                              <div>Sentiment: <span className="font-medium">{typeof entry.processed_insights.sentiment === 'number' ? (entry.processed_insights.sentiment > 0 ? 'Positive' : entry.processed_insights.sentiment < 0 ? 'Negative' : 'Neutral') : entry.processed_insights.sentiment}</span></div>
                            )}
                            {typeof entry.processed_insights.sentiment_score !== 'undefined' && (
                              <div>Sentiment Score: <span className="font-mono">{entry.processed_insights.sentiment_score}</span></div>
                            )}
                            {entry.processed_insights.keywords && entry.processed_insights.keywords.length > 0 && (
                              <div>Keywords: <span className="font-mono">{entry.processed_insights.keywords.join(', ')}</span></div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Button size="sm" onClick={() => startEdit(entry)} className="bg-blue-100 text-blue-700 border-blue-300">Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(entry)}>Delete</Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
} 