'use client';

import ChatInput from '@/app/components/ChatInput';
import ChatMessageCard from '@/app/components/ChatMessageCard';
import { useEffect, useRef, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = async (message: string) => {
    if (sending || !message.trim()) return;

    const userMessage: Message = { role: 'user', content: message };

    // 1️⃣ Add user message + research status message
    setMessages(prev => [
      ...prev,
      userMessage,
      {
        role: 'assistant',
        content: 'Scouting SoTL literature…',
      },
    ]);

    setSending(true);

    const res = await fetch('/api/sotl-scout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: message }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { value, done } = await reader!.read();
      if (done) break;

      fullText += decoder.decode(value, { stream: true });

      setMessages(prev => {
        const updated = [...prev];

        // Always replace the LAST assistant message
        updated[updated.length - 1] = {
          role: 'assistant',
          content: fullText,
        };

        return updated;
      });
    }

    setSending(false);
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <main className="relative min-h-screen flex flex-col bg-zinc-900 text-white">
      <div className="flex-1 overflow-y-auto  px-4 py-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {messages.length === 0 && (
          <ChatMessageCard
          role="assistant"
          content="Hi there! I can help you find relevant SoTL studies on any topic you're curious about."
        />
          )}

          {messages.map((msg, idx) => (
            <ChatMessageCard
              key={idx}
              role={msg.role}
              content={msg.content}
            />
          ))}

          <div ref={endOfMessagesRef} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-zinc-900 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <ChatInput
            onSend={sendMessage}
            placeholder={
              sending
                ? 'Scouting SoTL literature…'
                : 'Find SoTL studies on…'
            }
            disabled={sending}
          />
        </div>
      </div>
    </main>
  );
}
