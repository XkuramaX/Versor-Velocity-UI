import React, { useState } from 'react';
import { Bug, X, Send } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export default function ReportIssueButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('bug');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({
          title, description, type, priority,
          browser_info: navigator.userAgent,
        }),
      });
      setSubmitted(true);
      setTimeout(() => { setOpen(false); setSubmitted(false); setTitle(''); setDescription(''); }, 2000);
    } catch (e) {
      alert('Failed to submit: ' + e.message);
    }
    setSubmitting(false);
  };

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        title="Report an issue">
        <Bug className="w-5 h-5 text-white" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Report an Issue</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-emerald-400 font-medium">Ticket submitted!</p>
                <p className="text-slate-400 text-sm mt-1">We'll look into it.</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex gap-2">
                  <select value={type} onChange={e => setType(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm">
                    <option value="bug">🐛 Bug</option>
                    <option value="feature_request">✨ Feature</option>
                    <option value="question">❓ Question</option>
                    <option value="performance">⚡ Performance</option>
                  </select>
                  <select value={priority} onChange={e => setPriority(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief title"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none" />
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the issue... What happened? What did you expect?"
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none resize-none" />
                <button onClick={handleSubmit} disabled={!title.trim() || submitting}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2 rounded-lg font-medium disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
