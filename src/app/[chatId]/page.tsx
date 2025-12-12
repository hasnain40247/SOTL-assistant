'use client';

import ChatInput from '@/app/components/ChatInput';
import ChatMessageCard from '@/app/components/ChatMessageCard';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function ChatThreadPage() {
  const params = useParams();
  const { chatId } = params as { chatId: string };

  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [pdfText, setPdfText] = useState<string>(''); // store PDF separately
  const [title, setTitle] = useState<string>(''); // store PDF separately

  const [loading, setLoading] = useState(true); // track loading
  const [showWelcome, setShowWelcome] = useState(false); // show welcome message

  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadPdf() {
      setLoading(true); // start loading
      const res = await fetch(`/api/paper/${chatId}`);
      const data = await res.json();

      if (data.pdfText) {
        setPdfText(data.pdfText); // store PDF for context
      }
      if (data.title) {
        setTitle(data.title); 
      }

      setLoading(false); // finished loading
      setShowWelcome(true); // show welcome message once PDF is loaded
    }

    loadPdf();
  }, [chatId]);

  const sendMessage = async (message: string) => {
    if (loading) return; // prevent sending while PDF is loading

    const newUserMessage = { role: 'user' as const, content: message };
    setMessages(prev => [...prev, newUserMessage]);

    const conversationHistory = [
      { role: 'assistant', content: pdfText }, // context-only
      ...messages,
      newUserMessage
    ];

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        messages: conversationHistory
      }),
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
        const last = updated[updated.length - 1];

        if (last?.role !== 'assistant') {
          updated.push({ role: 'assistant', content: fullText });
        } else {
          updated[updated.length - 1].content = fullText;
        }
        return updated;
      });
    }
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <main className="relative min-h-screen flex flex-col bg-zinc-900 text-white">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {loading && (
            <div className="text-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-300">Loading PDF...</p>
            </div>
          )}

          {!loading && showWelcome && messages.length === 0 && (
            // <ChatMessageCard
            //   role="assistant"
            //   content={`Hello! I'm your SOTL research assistant. Ask me anything about this paper to get started. Start by asking me about the paper titled: ${title}`}
            // />
            <ChatMessageCard
  role="assistant"
  content={`Hello! I'm your SoTL research assistant. Ask me anything about this paper titled: ${title} or about your own study. 

I can help you:

1. Analyze the article’s inquiry approach, SoTL principles, research design, data collection methods, learning strategies, and classroom context   
2. Discuss your SoTL project, offer collegial guidance, pose reflective questions!`}
 />

          )}

          {!loading &&
            messages.map((msg, idx) => (
              <ChatMessageCard key={idx} role={msg.role} content={msg.content} />
            ))}

          <div ref={endOfMessagesRef} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-zinc-900 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={sendMessage}
            placeholder={loading ? 'Loading PDF...' : 'Reply...'}
            disabled={loading} // disable input while loading
          />
        </div>
      </div>
    </main>
  );
}
