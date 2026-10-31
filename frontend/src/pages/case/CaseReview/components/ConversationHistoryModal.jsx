import React, { useState, useEffect } from 'react';
import conversationService from '../../../../services/conversationService';

export default function ConversationHistoryModal({ conversationId, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !conversationId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    conversationService
      .getMessages(conversationId)
      .then((res) => {
        if (!isMounted) return;
        if (res?.success && Array.isArray(res.messages)) {
          setMessages(res.messages);
        } else {
          setMessages([]);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load conversation history.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, conversationId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overscroll-contain">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full h-[80vh] max-h-[80dvh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Original Consultation Dialog
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">ID: {conversationId}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none p-1 transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Message Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40 overscroll-contain scrollbar-thin">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <div className="case-spinner mx-auto mb-2" />
              Loading consultation messages...
            </div>
          ) : error ? (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
              No messages recorded in this consultation.
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id || m._id || idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {isUser ? 'Patient' : 'DoctAir Assistant'}
                    </span>
                    {m.inputMode === 'voice' && (
                      <span className="px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-[10px]">
                        🎤 Voice
                      </span>
                    )}
                    <span>
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-teal-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/40 dark:border-slate-700/60 space-y-1">
                        <span className={`text-[10px] uppercase tracking-wider font-semibold ${isUser ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          Attachments:
                        </span>
                        {m.attachments.map((att, aIdx) => (
                          <div key={aIdx} className={`text-[11px] flex items-center gap-1 ${isUser ? 'text-white' : 'text-teal-700 dark:text-teal-300 font-medium'}`}>
                            <span>📄</span> {att.originalName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-white dark:bg-slate-900 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
