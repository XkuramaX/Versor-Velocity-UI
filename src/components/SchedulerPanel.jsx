import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Play, Pause, Trash2, Upload, Download, FileText, X,
  RefreshCw, Copy, CheckCircle, AlertCircle, Loader, Calendar,
  Link, FolderOpen, History,
} from 'lucide-react';
import {
  getSchedule, setSchedule, deleteSchedule, toggleSchedule,
  getWatchedFiles, uploadWatchedFile, deleteWatchedFile,
  triggerWorkflow, getScheduleRunHistory, getWebhookUrl,
} from '../services/api';

const CRON_PRESETS = [
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every 6 hours', cron: '0 */6 * * *' },
  { label: 'Daily at 9am', cron: '0 9 * * *' },
  { label: 'Daily at midnight', cron: '0 0 * * *' },
  { label: 'Weekdays at 9am', cron: '0 9 * * 1-5' },
  { label: 'Weekly (Monday 9am)', cron: '0 9 * * 1' },
  { label: 'Monthly (1st at 9am)', cron: '0 9 1 * *' },
];

export default function SchedulerPanel({ workflowId, onClose }) {
  const [tab, setTab] = useState('schedule');
  const [schedule, setScheduleState] = useState(null);
  const [cronInput, setCronInput] = useState('0 9 * * *');
  const [files, setFiles] = useState([]);
  const [runs, setRuns] = useState([]);
  const [webhookInfo, setWebhookInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadAll(); }, [workflowId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sched, fileList, runList, webhook] = await Promise.all([
        getSchedule(workflowId),
        getWatchedFiles(workflowId),
        getScheduleRunHistory(workflowId),
        getWebhookUrl(workflowId),
      ]);
      setScheduleState(sched);
      if (sched.cron_expression) setCronInput(sched.cron_expression);
      setFiles(fileList.files || []);
      setRuns(runList || []);
      setWebhookInfo(webhook);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSaveSchedule = async () => {
    try {
      await setSchedule(workflowId, cronInput, true);
      await loadAll();
    } catch (e) { alert('Failed: ' + (e.response?.data?.detail || e.message)); }
  };

  const handleToggle = async () => {
    try {
      await toggleSchedule(workflowId, !schedule?.enabled);
      await loadAll();
    } catch (e) { alert('Failed to toggle'); }
  };

  const handleDelete = async () => {
    if (!confirm('Remove schedule?')) return;
    await deleteSchedule(workflowId);
    await loadAll();
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const result = await triggerWorkflow(workflowId, 'manual');
      alert(result.status === 'success' ? 'Workflow executed successfully!' : `Error: ${result.error}`);
      await loadAll();
    } catch (e) { alert('Trigger failed: ' + (e.response?.data?.detail || e.message)); }
    setTriggering(false);
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadWatchedFile(workflowId, file);
      await loadAll();
    } catch (err) { alert('Upload failed'); }
    e.target.value = '';
  };

  const handleDeleteFile = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;
    await deleteWatchedFile(workflowId, filename);
    await loadAll();
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookInfo?.example_curl || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Workflow Scheduler</h2>
              <p className="text-xs text-slate-400">Automate, trigger, and manage data files</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {[
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'files', label: 'Data Files', icon: FolderOpen },
            { id: 'webhook', label: 'Webhook', icon: Link },
            { id: 'history', label: 'Run History', icon: History },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'
              }`}>
              <t.icon className="w-4 h-4" /><span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader className="w-6 h-6 animate-spin text-cyan-400" /></div>
          ) : (
            <>
              {/* Schedule Tab */}
              {tab === 'schedule' && (
                <div className="space-y-5">
                  {schedule?.scheduled && (
                    <div className={`p-4 rounded-xl border ${schedule.enabled ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-700/50 border-slate-600'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            {schedule.enabled ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Pause className="w-4 h-4 text-slate-400" />}
                            <span className="text-sm font-medium text-white">{schedule.enabled ? 'Active' : 'Paused'}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Cron: <code className="text-cyan-400">{schedule.cron_expression}</code></p>
                          {schedule.next_run_at && <p className="text-xs text-slate-500 mt-0.5">Next: {new Date(schedule.next_run_at).toLocaleString()}</p>}
                          {schedule.last_run_at && <p className="text-xs text-slate-500">Last: {new Date(schedule.last_run_at).toLocaleString()}</p>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={handleToggle} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${schedule.enabled ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                            {schedule.enabled ? 'Pause' : 'Resume'}
                          </button>
                          <button onClick={handleDelete} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs">Remove</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Cron Expression</label>
                    <input type="text" value={cronInput} onChange={e => setCronInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                      placeholder="0 9 * * 1-5" />
                    <p className="text-xs text-slate-500 mt-1">Format: minute hour day-of-month month day-of-week</p>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Quick Presets</label>
                    <div className="flex flex-wrap gap-2">
                      {CRON_PRESETS.map(p => (
                        <button key={p.cron} onClick={() => setCronInput(p.cron)}
                          className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                            cronInput === p.cron ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                          }`}>{p.label}</button>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button onClick={handleSaveSchedule} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium text-sm transition-colors">
                      {schedule?.scheduled ? 'Update Schedule' : 'Create Schedule'}
                    </button>
                    <button onClick={handleTrigger} disabled={triggering}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors">
                      {triggering ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      <span>Run Now</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Files Tab */}
              {tab === 'files' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">Files in the watched folder for this workflow. The scheduler picks these up on each run.</p>
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                      <Upload className="w-4 h-4" /><span>Upload</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleUploadFile} />
                  </div>

                  {files.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No files yet. Upload files for the scheduler to use.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {files.map(f => (
                        <div key={f.filename} className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-cyan-400" />
                            <div>
                              <p className="text-sm text-white">{f.filename}</p>
                              <p className="text-xs text-slate-500">{f.size_mb} MB · Modified {new Date(f.modified_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <a href={`/scheduler/workflows/${workflowId}/files/${encodeURIComponent(f.filename)}/download`}
                              className="p-2 text-slate-400 hover:text-cyan-400"><Download className="w-4 h-4" /></a>
                            <button onClick={() => handleDeleteFile(f.filename)} className="p-2 text-slate-400 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Webhook Tab */}
              {tab === 'webhook' && webhookInfo && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-300">Use this URL to trigger the workflow from external systems (Airflow, Jenkins, cron scripts, etc.)</p>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Trigger URL</label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-cyan-400 text-sm font-mono truncate">
                        POST {webhookInfo.url}
                      </code>
                      <button onClick={copyWebhook} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
                        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Example: Simple trigger</label>
                    <pre className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-xs text-slate-300 overflow-x-auto">
                      {webhookInfo.example_curl}
                    </pre>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Example: Trigger with file upload</label>
                    <pre className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-xs text-slate-300 overflow-x-auto">
                      {webhookInfo.example_with_file}
                    </pre>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {tab === 'history' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">Recent workflow runs</p>
                    <button onClick={loadAll} className="p-2 text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
                  </div>

                  {runs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No runs yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {runs.map(r => (
                        <div key={r.id} className={`p-3 rounded-lg border ${
                          r.status === 'success' ? 'bg-green-500/5 border-green-500/20' :
                          r.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                          'bg-slate-700/30 border-slate-600/50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {r.status === 'success' ? <CheckCircle className="w-4 h-4 text-green-400" /> :
                               r.status === 'error' ? <AlertCircle className="w-4 h-4 text-red-400" /> :
                               <Loader className="w-4 h-4 text-blue-400 animate-spin" />}
                              <span className="text-sm text-white capitalize">{r.status}</span>
                              <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-400">{r.trigger_type}</span>
                            </div>
                            <span className="text-xs text-slate-500">{new Date(r.started_at).toLocaleString()}</span>
                          </div>
                          {r.duration_seconds && <p className="text-xs text-slate-500 mt-1">Duration: {r.duration_seconds.toFixed(1)}s</p>}
                          {r.error && <p className="text-xs text-red-400 mt-1 truncate">{r.error}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
