import React, { useState, useRef, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { askScholarBot } from '../../lib/groq';
import FormattedMarkdown from './FormattedMarkdown';

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'bot',
    text: 'Hello! I am ScholarBot, your AI Admin Assistant for Scholarq. How can I help you optimize school operations today?'
  }
];

const QUICK_PROMPTS = [
  '💡 Tips to boost fee collection rate',
  '📢 Draft PTA meeting announcement',
  '📊 Attendance summary & at-risk report',
  '📝 Summary of fee receivables'
];

export default function ScholarBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Real-time Firestore data
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubFees = onSnapshot(collection(db, 'fees'), (snap) => {
      setFees(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubStudents();
      unsubFees();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMessage = { id: Date.now(), sender: 'user', text: queryText };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    // Build real live school dataset
    const schoolData = {
      totalStudents: students.length,
      studentsList: students.map(
        (s) => `- ${s.name || 'Unnamed'} (${s.grade || ''} ${s.section || ''}): Attendance ${s.attendance || 0}%, Fee ${s.feeStatus || 'Pending'}, Guardian: ${s.guardian || 'N/A'}`
      ),
      totalCollected: fees
        .filter((f) => f.status === 'Paid')
        .reduce((sum, f) => sum + (f.amount || 0), 0),
      totalOutstanding: fees
        .filter((f) => f.status !== 'Paid')
        .reduce((sum, f) => sum + (f.amount || 0), 0),
      overdueInvoices: fees
        .filter((f) => f.status === 'Overdue')
        .map((f) => `- ${f.studentName} (${f.classSec}): $${f.amount} overdue since ${f.dueDate}`),
      pendingInvoices: fees
        .filter((f) => f.status === 'Pending')
        .map((f) => `- ${f.studentName} (${f.classSec}): $${f.amount} pending due ${f.dueDate}`)
    };

    try {
      const botResponse = await askScholarBot({
        query: queryText,
        history: messages,
        schoolData
      });

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: botResponse }
      ]);
    } catch (err) {
      console.error('ScholarBot API error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: `Sorry, I encountered an issue: ${err.message || 'Please verify your API key and try again.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div class="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          class="relative group bg-gradient-to-r from-primary to-secondary text-on-primary p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-xs"
          title="Open ScholarBot AI Assistant"
        >
          <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-secondary-fixed rounded-full animate-ping"></span>
          <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-secondary-fixed rounded-full border-2 border-surface"></span>
          <span class="material-symbols-outlined text-[28px]">auto_awesome</span>
          <span class="font-label-md pr-1 hidden sm:inline font-bold">ScholarBot</span>
        </button>
      )}

      {isOpen && (
        <div class="w-[92vw] sm:w-[440px] h-[600px] max-h-[85vh] bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl shadow-2xl border border-outline-variant/60 flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div class="bg-gradient-to-r from-primary to-primary/90 p-md text-on-primary flex justify-between items-center shadow-sm">
            <div class="flex items-center gap-md">
              <div class="w-9 h-9 rounded-full bg-on-primary/20 flex items-center justify-center border border-on-primary/30">
                <span class="material-symbols-outlined text-on-primary text-[20px]">smart_toy</span>
              </div>
              <div>
                <h4 class="font-headline-sm text-[16px] text-on-primary font-bold">ScholarBot AI</h4>
                <p class="text-[11px] text-on-primary/80 flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
                  Connected to Real School Database
                </p>
              </div>
            </div>
            <div class="flex items-center gap-xs">
              <button
                onClick={() => setMessages(INITIAL_MESSAGES)}
                title="Clear Chat"
                class="p-1.5 hover:bg-on-primary/10 rounded-full transition-colors text-on-primary/80 hover:text-on-primary"
              >
                <span class="material-symbols-outlined text-[18px]">restart_alt</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                class="p-1.5 hover:bg-on-primary/10 rounded-full transition-colors text-on-primary/80 hover:text-on-primary"
              >
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div class="flex-1 p-md overflow-y-auto space-y-md bg-surface/50 scrollbar-hide">
            {messages.map((msg) => (
              <div
                key={msg.id}
                class={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  class={`max-w-[88%] p-md rounded-2xl text-body-md leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-primary text-on-primary rounded-br-xs'
                      : 'bg-surface-container-high text-on-surface rounded-bl-xs border border-outline-variant/30'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p class="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <FormattedMarkdown content={msg.text} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div class="flex justify-start">
                <div class="bg-surface-container-high p-md rounded-2xl rounded-bl-xs flex items-center gap-xs">
                  <span class="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                  <span class="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span class="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div class="px-md py-xs bg-surface-container-low border-t border-outline-variant/30 flex items-center gap-xs overflow-x-auto scrollbar-hide">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qp)}
                  class="text-[11px] whitespace-nowrap px-md py-1 bg-surface-container-lowest border border-outline-variant/60 rounded-full text-on-surface hover:bg-primary-fixed hover:text-primary transition-all shadow-2xs"
                >
                  {qp}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div class="p-md bg-surface-container-lowest border-t border-outline-variant/40 flex items-center gap-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask ScholarBot about real students or fees..."
              rows={1}
              class="flex-1 bg-surface border border-outline-variant rounded-xl px-md py-2 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/30 resize-none max-h-24"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              class="bg-primary text-on-primary p-2.5 rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all shadow-sm flex items-center justify-center"
            >
              <span class="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
