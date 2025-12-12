'use client';

import { useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder: string;
  disabled: boolean;


}

export default function ChatInput({ onSend,placeholder,disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message);
    setMessage('');
  };

  return (
    <div className="border border-zinc-700 rounded-2xl p-4 text-white bg-zinc-900">
<textarea
  value={message}
  onChange={(e) => {
    setMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  }}
  placeholder={placeholder}
  rows={1}
  className={`w-full bg-transparent resize-none outline-none placeholder:text-zinc-400 text-base overflow-y-auto max-h-40 ${
    message ? '' : 'animate-placeholder-flash'
  }`}
  style={{ lineHeight: '1.5' }}
/>

      <div className="flex justify-end items-center space-x-3 mt-4">
        <button
        disabled={disabled}
          onClick={handleSend}
          className={`${
            !disabled ? 'animate-bounce' : ''
          } bg-[#FE7743]  hover:bg-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full h-10 w-10 flex items-center justify-center`}
        >
          <span className="text-xl leading-none">↑</span>
        </button>
      </div>
    </div>
  );
}
