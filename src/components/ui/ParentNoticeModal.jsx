import React, { useState, useEffect } from 'react';
import { generateParentMessage } from '../../lib/groq';
import { useAuth } from '../../context/AuthContext';

export default function ParentNoticeModal({ isOpen, onClose, initialData = {} }) {
  const { userProfile } = useAuth();
  const isTeacher = userProfile?.role === 'teacher';

  const [studentName, setStudentName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [issueType, setIssueType] = useState('Unexcused Absence Alert');
  const [tone, setTone] = useState('Empathetic');
  const [details, setDetails] = useState('');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [sentStatus, setSentStatus] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStudentName(initialData.studentName || initialData.name || 'Student');
      setGuardianName(initialData.guardianName || initialData.guardian || '');
      if (!isTeacher && (initialData.status === 'Overdue' || initialData.amount)) {
        setIssueType('Fee Payment Reminder');
        setTone('Urgent');
        if (initialData.amount) {
          setDetails(`Invoice ID: ${initialData.id || ''}, Amount: $${initialData.amount}, Due: ${initialData.dueDate || 'Immediate'}`);
        }
      } else {
        setIssueType(isTeacher ? 'Unexcused Absence Alert' : 'Fee Payment Reminder');
        setTone('Empathetic');
        setDetails('');
      }
      setMessage('');
      setError('');
      setCopied(false);
      setSentStatus(false);
    }
  }, [isOpen, initialData, isTeacher]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!studentName.trim()) {
      setError('Student name is required.');
      return;
    }
    setLoading(true);
    setError('');
    setCopied(false);
    setSentStatus(false);

    try {
      const generated = await generateParentMessage({
        studentName,
        guardianName,
        issueType,
        tone,
        details
      });
      setMessage(generated);
    } catch (err) {
      console.error('Failed to generate parent message:', err);
      setError(err.message || 'Could not generate message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleSend = () => {
    setSentStatus(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div
      class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-xs p-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        class="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant p-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex justify-between items-center mb-md border-b border-outline-variant/30 pb-md">
          <div class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-primary text-[24px]">auto_awesome</span>
            <h3 class="font-headline-sm text-primary font-bold">Smart Parent Communication</h3>
          </div>
          <button
            onClick={onClose}
            class="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        {sentStatus ? (
          <div class="py-xl text-center animate-fadeIn">
            <span class="material-symbols-outlined text-secondary text-5xl mb-sm animate-bounce">
              mark_email_read
            </span>
            <h4 class="font-headline-md text-on-surface">Message Sent to Guardian!</h4>
            <p class="text-body-md text-on-surface-variant mt-xs">
              Dispatch queued via Scholarq Parent Notification Gateway.
            </p>
          </div>
        ) : (
          <div class="space-y-md">
            {error && (
              <div class="bg-error-container text-error text-label-md p-md rounded-lg">
                {error}
              </div>
            )}

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Student Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  class="w-full border border-outline-variant rounded-lg px-md py-2 text-body-md bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Guardian Name</label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Mrs. Okafor"
                  class="w-full border border-outline-variant rounded-lg px-md py-2 text-body-md bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Notice Type</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  class="w-full border border-outline-variant rounded-lg px-md py-2 text-body-md bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {!isTeacher && <option value="Fee Payment Reminder">Fee Payment Reminder</option>}
                  <option value="Unexcused Absence Alert">Unexcused Absence Alert</option>
                  <option value="Academic & Behavioral Appreciation">Academic / Progress Kudos</option>
                  <option value="General School Announcement">General School Update</option>
                </select>
              </div>
              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Communication Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  class="w-full border border-outline-variant rounded-lg px-md py-2 text-body-md bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="Empathetic">Empathetic & Supportive</option>
                  <option value="Formal">Formal & Professional</option>
                  <option value="Direct">Direct & Concise</option>
                  <option value="Urgent">Urgent / Action Required</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-label-md text-on-surface-variant mb-xs">Specific Details (Optional)</label>
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={isTeacher ? "e.g. Unexcused absence on Oct 15 or great progress in class" : "e.g. Due date Oct 15, outstanding balance $1,450"}
                class="w-full border border-outline-variant rounded-lg px-md py-2 text-body-md bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              class="w-full flex items-center justify-center gap-xs py-2.5 bg-primary text-on-primary rounded-xl font-label-md hover:opacity-95 active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span class="w-4 h-4 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin"></span>
                  Crafting AI Notice…
                </>
              ) : (
                <>
                  <span class="material-symbols-outlined text-[20px]">auto_awesome</span>
                  Generate AI Parent Message
                </>
              )}
            </button>

            {message && (
              <div class="mt-md space-y-xs animate-fadeIn">
                <label class="block font-label-md text-on-surface-variant">Generated Message Draft</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  class="w-full border border-outline-variant rounded-xl p-md text-body-md text-on-surface bg-surface-container-low outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed resize-none"
                />
                <div class="flex gap-sm pt-xs">
                  <button
                    onClick={handleCopy}
                    class="flex-1 flex items-center justify-center gap-xs py-2 border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <span class="material-symbols-outlined text-[18px]">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                    {copied ? 'Copied to Clipboard!' : 'Copy Text'}
                  </button>
                  <button
                    onClick={handleSend}
                    class="flex-1 flex items-center justify-center gap-xs py-2 bg-secondary text-on-secondary rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all shadow-sm"
                  >
                    <span class="material-symbols-outlined text-[18px]">send</span>
                    Dispatch Notice
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
