import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, Upload, X, FileText, Loader,
  AlertTriangle, CheckCircle, XCircle, ChevronDown,
  Lightbulb, RotateCcw,
} from 'lucide-react';
import { generateWorkflow, refineWorkflow, getAIStatus } from '../services/api';

function FileChip({ file, onRemove }) {
  return (
    <div className="flex items-center space-x-1.5 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs">
      <FileText className="w-3 h-3 text-cyan-400" />
      <span className="text-white truncate max-w-[120px]">{file.name}</span>
      <button onClick={onRemove} className="text-slate-400 hover:text-red-400"><X className="w-3 h-3" /></button>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
        isUser
          ? 'bg-purple-600/30 border border-purple-500/30 text-white'
          : msg.type === 'error'
            ? 'bg-red-500/10 border border-red-500/30 text-red-300'
            : 'bg-slate-700/50 border border-slate-600/50 text-slate-200'
      }`}>
        {/* Show attached files in user messages */}
        {isUser && msg.files && msg.files.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {msg.files.map((name, i) => (
              <span key={i} className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded text-[10px] text-cyan-300">
                <FileText className="w-2.5 h-2.5" />
                <span>{name}</span>
              </span>
            ))}
          </div>
        )}
        {msg.type === 'feasibility' && (
          <div className="flex items-center space-x-2 mb-1.5">
            {msg.feasibility === 'full' && <CheckCircle className="w-4 h-4 text-green-400" />}
            {msg.feasibility === 'partial' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
            {msg.feasibility === 'none' && <XCircle className="w-4 h-4 text-red-400" />}
            <span className={`text-xs font-semibold ${
              msg.feasibility === 'full' ? 'text-green-400' :
              msg.feasibility === 'partial' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {msg.feasibility === 'full' ? 'Fully achievable' :
               msg.feasibility === 'partial' ? 'Partially achievable' : 'Not achievable'}
            </span>
          </div>
        )}
        <p className="whitespace-pre-wrap">{msg.text}</p>
        {msg.steps && msg.steps.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {msg.steps.map((s, i) => (
              <div key={i} className="flex items-start space-x-1.5 text-xs text-slate-400">
                <span className="text-cyan-500 font-mono">{i + 1}.</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}
        {msg.gaps && msg.gaps.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-red-400 font-medium">Missing capabilities:</p>
            {msg.gaps.map((g, i) => (
              <div key={i} className="text-xs text-slate-400 pl-2 border-l-2 border-red-500/30">
                {g.title} — {g.missing_capability}
              </div>
            ))}
          </div>
        )}
        {msg.blocked_premium && msg.blocked_premium.length > 0 && (
          <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-xs text-amber-400 font-semibold mb-1">⚡ Premium nodes required</p>
            <p className="text-xs text-slate-400 mb-2">This workflow needs nodes that are not included in your current plan:</p>
            <div className="space-y-1">
              {msg.blocked_premium.map((b, i) => (
                <div key={i} className="text-xs flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">{b.group}</span>
                  <span className="text-white">{b.name}</span>
                  <span className="text-slate-500">({b.node_id})</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-300 mt-2">Contact your admin to add these node groups to your plan.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIChatPanel({ onWorkflowGenerated, getWorkflowState, inputSchemas, setInputSchemas }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [inputFiles, setInputFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [ollamaOk, setOllamaOk] = useState(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const checkStatus = () => {
      getAIStatus()
        .then(s => setOllamaOk(s.ollama_running && s.model_ready !== false))
        .catch(() => setOllamaOk(false));
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasWorkflow = () => {
    const state = getWorkflowState?.();
    return state && state.nodes && state.nodes.length > 0;
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userText = input.trim();
    setInput('');

    setMessages(prev => [...prev, {
      role: 'user',
      text: userText,
      files: inputFiles.map(f => f.name),
    }]);
    setSending(true);

    try {
      if (!hasWorkflow()) {
        // First generation — need files
        if (inputFiles.length === 0) {
          setMessages(prev => [...prev, {
            role: 'ai', type: 'error',
            text: 'Please attach at least one input file using the 📎 button before generating a workflow.',
          }]);
          setSending(false);
          return;
        }

        const result = await generateWorkflow(inputFiles, null, userText);

        // Store schemas for future refinements
        if (result.input_schemas) {
          setInputSchemas?.(result.input_schemas);
        }

        // Add AI response message
        setMessages(prev => [...prev, {
          role: 'ai',
          type: 'feasibility',
          feasibility: result.feasibility,
          text: result.reasoning || 'Analysis complete.',
          steps: result.feasible_steps,
          gaps: result.gaps,
          blocked_premium: result.blocked_premium,
        }]);

        if (result.workflow) {
          onWorkflowGenerated(result.workflow);
          setMessages(prev => [...prev, {
            role: 'ai', type: 'info',
            text: '✅ Workflow generated and loaded onto the canvas. You can now:\n• Upload files to the upload_csv nodes\n• Click "Run All" to execute\n• Edit any node config in the Properties panel\n• Send me another message to modify the workflow',
          }]);
        }
      } else {
        // Refinement — modify existing workflow
        const currentState = getWorkflowState();
        // Strip callbacks before sending to backend
        const cleanNodes = currentState.nodes.map(n => {
          const { onInspect, onDelete, onRun, onUpload, onClearData, onDownload, onSaveToHistory, onLabelChange, ...rest } = n.data;
          return { ...n, data: rest };
        });

        const result = await refineWorkflow(
          userText,
          { nodes: cleanNodes, edges: currentState.edges },
          inputSchemas || []
        );

        if (result.workflow) {
          onWorkflowGenerated(result.workflow);
          setMessages(prev => [...prev, {
            role: 'ai', type: 'info',
            text: '✅ Workflow updated. The canvas has been refreshed with the changes. You can run it or continue refining.',
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'ai', type: 'error',
            text: 'Failed to generate a valid workflow from the refinement. Try rephrasing your request.',
          }]);
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai', type: 'error',
        text: err.response?.data?.detail || err.message || 'Something went wrong.',
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddFiles = (fileArray) => {
    const valid = fileArray.filter(f =>
      f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    );
    if (valid.length > 0) {
      setInputFiles(prev => [...prev, ...valid]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
        </div>
        <button
          onClick={() => {
            setOllamaOk(null);
            getAIStatus()
              .then(s => setOllamaOk(s.ollama_running && s.model_ready !== false))
              .catch(() => setOllamaOk(false));
          }}
          className={`flex items-center space-x-1.5 text-xs cursor-pointer hover:opacity-80 ${
            ollamaOk ? 'text-green-400' : ollamaOk === false ? 'text-red-400' : 'text-slate-400'
          }`}
        >
          {ollamaOk === null ? <Loader className="w-3 h-3 animate-spin" /> :
           ollamaOk ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          <span>{ollamaOk === null ? 'Checking…' : ollamaOk ? 'LLM ready' : 'LLM offline — click to retry'}</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <Sparkles className="w-10 h-10 text-slate-700 mx-auto" />
            <p className="text-sm text-slate-500">Describe what you want to build.</p>
            <div className="text-xs text-slate-600 space-y-1">
              <p>📎 Attach your CSV files first</p>
              <p>💬 Then describe the transformation</p>
              <p>🔄 Keep chatting to refine the workflow</p>
              <p>🖱️ You can also edit nodes manually</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 flex items-center space-x-2">
              <Loader className="w-4 h-4 animate-spin text-purple-400" />
              <span className="text-sm text-slate-400">
                {hasWorkflow() ? 'Refining workflow…' : 'Analysing & generating…'}
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* File chips */}
      {inputFiles.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {inputFiles.map((f, i) => (
            <FileChip key={i} file={f} onRemove={() => setInputFiles(prev => prev.filter((_, idx) => idx !== i))} />
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="p-3 border-t border-slate-700/50">
        <div className="flex items-end space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Attach CSV files"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files);
              if (files.length > 0) handleAddFiles(files);
              e.target.value = '';
            }}
          />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder={hasWorkflow()
              ? "Describe changes to the workflow…"
              : "Attach files, then describe what you want…"
            }
            className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm resize-none focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-1.5 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
