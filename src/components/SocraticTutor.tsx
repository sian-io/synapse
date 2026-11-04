import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  ShieldAlert,
  Plus,
  Copy,
  Check,
  Pencil,
  Square,
  Download,
  MoreVertical,
} from 'lucide-react';
import Markdown, { type Components } from 'react-markdown';
import { api } from '../api';
import { ChatMessage } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PreContext = React.createContext(false);

const SocraticCodeBlock: React.FC<{
  language?: string;
  code: string;
  isPt: boolean;
}> = ({ language, code, isPt }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div className="my-3 rounded-lg surface-recessed overflow-hidden">
      <div className="px-3 py-1.5 border-b border-white/[0.05] bg-[#09090b]/60 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 tabular-nums">
          {language || 'CODE'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-100 hover:bg-[#16161a] transition-colors flex items-center gap-1 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-zinc-200 stroke-[1.75]" />
              <span>{isPt ? 'Copiado' : 'Copied'}</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-zinc-500 stroke-[1.75]" />
              <span>{isPt ? 'Copiar' : 'Copy'}</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto font-mono text-xs text-zinc-200 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const createMarkdownComponents = (isPt: boolean): Components => ({
  p: ({ children }) => (
    <p className="text-[15px] text-zinc-200 leading-relaxed mb-3 last:mb-0">{children}</p>
  ),
  h1: ({ children }) => (
    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100 mt-5 mb-2.5 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-100 mt-4 mb-2 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold tracking-tight text-zinc-100 mt-4 mb-1.5 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-zinc-200 mt-3 mb-1 first:mt-0">
      {children}
    </h4>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 my-2.5 space-y-1.5 text-[15px] text-zinc-200 marker:text-zinc-500">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 my-2.5 space-y-1.5 text-[15px] text-zinc-200 marker:text-zinc-500 marker:font-mono marker:text-xs tabular-nums">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed pl-1 [&>p]:mb-1.5 [&>p:last-child]:mb-0">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-zinc-400 bg-[#050507]/60 pl-3.5 py-2 pr-3 rounded-r-md text-sm text-zinc-300 italic [&>p]:mb-1.5 [&>p:last-child]:mb-0">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-100">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
  hr: () => <hr className="my-4 border-0 border-t border-white/[0.06]" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-zinc-100 underline decoration-white/30 underline-offset-4 hover:decoration-white transition-colors"
    >
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <PreContext.Provider value={true}>{children}</PreContext.Provider>
  ),
  code: ({ className, children }) => {
    const isInsidePre = React.useContext(PreContext);
    const match = /language-([\w-]+)/.exec(className || '');
    const rawCode = String(children).replace(/\n$/, '');

    if (isInsidePre || match) {
      return <SocraticCodeBlock language={match?.[1]} code={rawCode} isPt={isPt} />;
    }

    return (
      <code className="bg-[#050507] border border-white/[0.07] px-1.5 py-0.5 rounded font-mono text-[12px] text-zinc-200">
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-white/[0.07]">
      <table className="w-full border-collapse text-left text-xs text-zinc-200">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[#050507] border-b border-white/[0.07] font-mono text-[10px] uppercase tracking-wider text-zinc-400">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-white/[0.05]">{children}</tbody>
  ),
  tr: ({ children }) => <tr className="transition-colors">{children}</tr>,
  th: ({ children }) => <th className="px-3 py-2 font-medium">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 text-zinc-300">{children}</td>,
});

interface SocraticTutorProps {
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

export const SocraticTutor: React.FC<SocraticTutorProps> = ({
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const { t, language } = useLanguage();
  const isPt = language === 'pt';
  const markdownComponents = React.useMemo(() => createMarkdownComponents(isPt), [isPt]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved =
      localStorage.getItem('synapse_chat_history') ||
      localStorage.getItem(`synapse_chat_history_${language}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (m: ChatMessage) => !m.id?.startsWith('err_') && m.id !== 'msg_welcome'
          );
          if (cleaned.length > 0) return cleaned;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metacognitiveCertainty, setMetacognitiveCertainty] = useState<number>(3);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const lastHandledPromptRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    isSendingRef.current = false;
  };

  useEffect(() => {
    if (!initialPrompt) {
      lastHandledPromptRef.current = null;
      return;
    }
    const trimmed = initialPrompt.trim();
    if (trimmed && lastHandledPromptRef.current !== trimmed) {
      lastHandledPromptRef.current = trimmed;
      handleSendMessage(trimmed);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('synapse_chat_history', JSON.stringify(messages));
    } else {
      localStorage.removeItem('synapse_chat_history');
    }
    if (messages.length > 0 || error) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, error]);

  const requestAssistantResponse = async (historyToSend: ChatMessage[]) => {
    setIsLoading(true);
    setError(null);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const messagesToSend = historyToSend
        .filter((m) => m.id !== 'msg_welcome')
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await api.api.chat.$post(
        {
          json: {
            messages: messagesToSend,
            mode: 'socratic',
            studentCalibration: metacognitiveCertainty,
            language,
          },
        },
        {
          init: {
            signal: controller.signal,
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || t.socratic.connectionError);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return;
      }
      console.error(err);
      setError(err.message || t.socratic.connectionError);
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading || isSendingRef.current) return;
    isSendingRef.current = true;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    await requestAssistantResponse(newMessages);
  };

  const handleRetry = async () => {
    if (isLoading || isSendingRef.current || messages.length === 0) return;
    isSendingRef.current = true;
    await requestAssistantResponse(messages);
  };

  const handleRegenerateMessage = async (index: number) => {
    if (isLoading || isSendingRef.current) return;
    const historyBefore = messages.slice(0, index);
    if (historyBefore.length === 0) return;
    isSendingRef.current = true;
    setEditingMessageId(null);
    setEditingContent('');
    setMessages(historyBefore);
    await requestAssistantResponse(historyBefore);
  };

  const handleStartEditMessage = (message: ChatMessage) => {
    if (isLoading || isSendingRef.current) return;
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSaveEditMessage = async (index: number) => {
    const trimmed = editingContent.trim();
    if (!trimmed || isLoading || isSendingRef.current) return;
    const targetMessage = messages[index];
    if (!targetMessage) return;
    isSendingRef.current = true;

    const updatedUserMessage: ChatMessage = {
      ...targetMessage,
      content: trimmed,
      timestamp: Date.now(),
    };

    const newMessages = [...messages.slice(0, index), updatedUserMessage];
    setEditingMessageId(null);
    setEditingContent('');
    setMessages(newMessages);

    await requestAssistantResponse(newMessages);
  };

  const handleCopyMessage = async (message: ChatMessage) => {
    const cleanText =
      message.role === 'assistant'
        ? message.content.replace(/(?:[\r\n]+\s*(?:[-*_]\s*){3,})+$/, '').trim()
        : message.content;
    try {
      await navigator.clipboard.writeText(cleanText);
      setCopiedMessageId(message.id);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedMessageId(null), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  const handleConfirmClearHistory = () => {
    setMessages([]);
    setError(null);
    localStorage.removeItem('synapse_chat_history_en');
    localStorage.removeItem('synapse_chat_history_pt');
    localStorage.removeItem('synapse_chat_history');
    setIsResetDialogOpen(false);
  };

  const isEmpty = messages.length === 0 && !error && !isLoading;
  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf('assistant');

  const renderComposerForm = (formClassName: string) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSendMessage();
      }}
      className={`flex items-center gap-2 ${formClassName}`}
    >
      <Popover open={isCalibrationOpen} onOpenChange={setIsCalibrationOpen}>
        <PopoverTrigger
          type="button"
          title={t.socratic.metacognitiveTitle}
          className="h-10 px-3 rounded-md surface-recessed hover:bg-[#16161a] hover:border-white/[0.14] text-zinc-300 hover:text-zinc-100 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
          <span className="font-mono tabular-nums text-xs font-medium text-zinc-200">
            {metacognitiveCertainty}/5
          </span>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-64 p-3.5 rounded-xl surface-panel text-zinc-100 ring-0 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
              {t.socratic.metacognitiveTitle}
            </span>
            <span className="font-mono text-[11px] tabular-nums font-semibold text-zinc-100 surface-recessed px-1.5 py-0.5 rounded">
              {metacognitiveCertainty}/5
            </span>
          </div>

          <div
            role="group"
            aria-label={t.socratic.metacognitiveTitle}
            className="bg-[#050507] p-1 rounded-lg border border-white/[0.06] grid grid-cols-5 gap-1"
          >
            {[1, 2, 3, 4, 5].map((level) => {
              const isSelected = metacognitiveCertainty === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    setMetacognitiveCertainty(level);
                    setIsCalibrationOpen(false);
                  }}
                  className={`h-7 rounded-md font-mono tabular-nums text-xs transition-colors cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'bg-zinc-100 text-zinc-950 font-semibold'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#16161a]'
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between text-[10px] text-zinc-500 font-mono tabular-nums uppercase tracking-wider">
            <span>{t.socratic.guess}</span>
            <span>{t.socratic.partial}</span>
            <span>{t.socratic.conviction}</span>
          </div>
        </PopoverContent>
      </Popover>

      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t.socratic.inputPlaceholder}
        disabled={isLoading}
        className="flex-1 h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:border-white/[0.14] focus-visible:ring-0 disabled:opacity-50"
      />

      {isLoading ? (
        <Button
          type="button"
          onClick={handleCancel}
          className="h-10 px-4 surface-recessed hover:bg-[#16161a] hover:border-white/[0.14] text-zinc-200 font-medium text-[13px] rounded-md transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          title={t.socratic.cancel}
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">{t.socratic.cancel}</span>
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={!input.trim()}
          className="h-10 px-4 bg-zinc-100 hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-600 text-zinc-950 font-medium text-[13px] rounded-md transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          title={t.socratic.sendTooltip}
        >
          <span className="hidden sm:inline">{t.socratic.sendButton}</span>
          <Send className="w-3.5 h-3.5 stroke-[1.75]" />
        </Button>
      )}
    </form>
  );

  return (
    <div className="w-full flex flex-col flex-1 min-h-[520px] surface-panel rounded-xl overflow-hidden relative">
      {/* Options Menu (PDF Export & Reset) */}
      {!isEmpty && (
        <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 no-print">
          <Popover open={isOptionsMenuOpen} onOpenChange={setIsOptionsMenuOpen}>
            <PopoverTrigger
              type="button"
              className="h-8 w-8 rounded-md surface-recessed hover:bg-[#16161a] hover:border-white/[0.14] text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
              title={isPt ? 'Opções' : 'Options'}
            >
              <MoreVertical className="w-4 h-4 stroke-[1.75]" />
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              sideOffset={4}
              className="w-44 p-1 rounded-lg surface-panel border border-white/[0.08] shadow-lg ring-0 flex flex-col gap-0.5 z-30"
            >
              <button
                type="button"
                onClick={() => {
                  setIsOptionsMenuOpen(false);
                  window.print();
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-[#16161a] rounded-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
                <span>{t.socratic.exportPdf}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOptionsMenuOpen(false);
                  setIsResetDialogOpen(true);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-[#16161a] rounded-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
                <span>{t.socratic.resetTooltip}</span>
              </button>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-12 animate-fade-in">
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100 text-center text-balance">
              {t.socratic.defaultWelcome}
            </h1>
            {renderComposerForm('w-full')}
          </div>
        </div>
      ) : (
        <>
          {/* Editorial Log Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05]">
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              const isCopied = copiedMessageId === message.id;
              const isEditing = isUser && editingMessageId === message.id;
              const isLastAssistant = !isUser && index === lastAssistantIndex;
              return (
                <div
                  key={message.id}
                  className={`px-5 sm:px-8 py-6 transition-colors ${
                    isUser ? 'bg-[#050507]/70' : 'bg-[#0f0f12]'
                  }`}
                >
                  <div className="max-w-3xl mx-auto">
                    {/* Entry Metadata Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[13px] uppercase tracking-widest text-zinc-500">
                        {isUser ? t.socratic.you : t.socratic.assistant}
                      </span>
                      <span className="text-[13px] text-zinc-500 font-mono tabular-nums">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Entry Body */}
                    {isUser ? (
                      isEditing ? (
                        <div className="space-y-3 no-print">
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={3}
                            className="w-full surface-recessed rounded-md px-3.5 py-2.5 text-[15px] text-zinc-100 leading-relaxed focus-visible:border-white/[0.14] focus-visible:ring-0 resize-y"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEditMessage}
                              className="h-8 px-3 rounded-md surface-recessed hover:bg-[#16161a] hover:border-white/[0.14] text-xs text-zinc-400 hover:text-zinc-100 font-medium transition-colors cursor-pointer"
                            >
                              {t.socratic.cancelEdit}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSaveEditMessage(index)}
                              disabled={!editingContent.trim() || isLoading}
                              className="h-8 px-3 rounded-md bg-zinc-100 hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-600 text-zinc-950 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>{t.socratic.saveAndSubmit}</span>
                              <Send className="w-3 h-3 stroke-[1.75]" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-[15px] text-zinc-100 leading-relaxed pl-3 border-l border-zinc-600">
                          {message.content}
                        </p>
                      )
                    ) : (
                      <div className="space-y-4">
                        <div className="max-w-none text-[15px] text-zinc-200 leading-relaxed">
                          <Markdown components={markdownComponents}>
                            {message.content.replace(/(?:[\r\n]+\s*(?:[-*_]\s*){3,})+$/, '').trim()}
                          </Markdown>
                        </div>
                      </div>
                    )}

                    {/* Entry Actions */}
                    {!isEditing && (
                      <div className="mt-3.5 flex items-center gap-1.5 no-print">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(message)}
                          className="px-2.5 py-1 rounded-md text-xs text-zinc-400 hover:text-zinc-100 hover:bg-[#16161a] transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-zinc-200 stroke-[1.75]" />
                              <span>{t.socratic.copiedMessage}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                              <span>{t.socratic.copyMessage}</span>
                            </>
                          )}
                        </button>

                        {isUser && (
                          <button
                            type="button"
                            onClick={() => handleStartEditMessage(message)}
                            disabled={isLoading}
                            className="px-2.5 py-1 rounded-md text-xs text-zinc-400 hover:text-zinc-100 hover:bg-[#16161a] disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                            <span>{t.socratic.editMessage}</span>
                          </button>
                        )}

                        {isLastAssistant && (
                          <button
                            type="button"
                            onClick={() => handleRegenerateMessage(index)}
                            disabled={isLoading}
                            className="px-2.5 py-1 rounded-md text-xs text-zinc-400 hover:text-zinc-100 hover:bg-[#16161a] disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                            <span>{t.socratic.regenerate}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {error && !isLoading && (
              <div className="max-w-3xl mx-auto px-5 sm:px-0 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-zinc-300">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRetry}
                  className="h-8 px-3 rounded-md surface-panel hover:bg-[#16161a] text-zinc-200 text-[13px] font-medium flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.socratic.retry}</span>
                </Button>
              </div>
            )}

            {isLoading && (
              <div className="max-w-3xl mx-auto px-5 sm:px-0 py-6 flex items-center justify-between gap-3 text-sm text-zinc-400">
                <div className="flex items-center gap-3">
                  <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-300" />
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                    {t.socratic.loadingText}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-7 px-2.5 surface-recessed hover:bg-[#16161a] hover:border-white/[0.14] text-zinc-300 text-xs rounded-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>{t.socratic.cancel}</span>
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form & Pop-up Metacognitive Calibration Bar */}
          <div className="px-4 py-4 sm:px-8 bg-[#09090b]/80 border-t border-white/[0.07] shrink-0">
            {renderComposerForm('max-w-3xl mx-auto')}
          </div>
        </>
      )}

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="surface-panel rounded-xl text-zinc-100 ring-0 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-zinc-100">
              {t.socratic.resetTooltip}?
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 leading-relaxed">
              {t.socratic.resetConfirm}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-[#050507] border-white/[0.07]">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-md text-xs text-zinc-400 hover:text-zinc-100 hover:bg-[#16161a] cursor-pointer"
                />
              }
            >
              {isPt ? 'Cancelar' : 'Cancel'}
            </DialogClose>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmClearHistory}
              className="rounded-md bg-zinc-100 text-zinc-950 hover:bg-white font-medium text-xs cursor-pointer"
            >
              {isPt ? 'Confirmar' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
