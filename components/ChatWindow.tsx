
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatWindowProps {
  messages: Message[];
  onSend: (text: string) => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSend, onFileUpload, isLoading }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#efeae2] relative overflow-hidden">
      {/* Chat Header */}
      <div className="h-16 bg-[#f0f2f5] flex items-center px-4 justify-between border-b shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border shadow-sm overflow-hidden">
             <img src="https://picsum.photos/seed/clara/100" className="w-full h-full object-cover" alt="Clara" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Clara | Conecta Clientes</h3>
            <span className="text-xs text-green-600 font-medium">Online</span>
          </div>
        </div>
        <div className="flex gap-4 text-gray-500">
          <button className="hover:text-gray-700"><i className="fa-solid fa-magnifying-glass"></i></button>
          <button className="hover:text-gray-700"><i className="fa-solid fa-ellipsis-vertical"></i></button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`max-w-[85%] md:max-w-[70%] p-3 rounded-lg shadow-sm flex flex-col ${
              msg.role === 'user' 
                ? 'self-end bg-[#dcf8c6] text-gray-800 rounded-tr-none' 
                : 'self-start bg-white text-gray-800 rounded-tl-none'
            }`}
          >
            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
            <span className="text-[10px] text-gray-500 self-end mt-1">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="self-start bg-white p-3 rounded-lg shadow-sm rounded-tl-none">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-.15s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#f0f2f5] flex items-center gap-3 z-10">
        <button className="text-gray-500 hover:text-gray-700 text-xl"><i className="fa-regular fa-face-smile"></i></button>
        
        {/* File Upload Logic */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".csv,.json,.txt" 
          className="hidden" 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          <i className="fa-solid fa-paperclip"></i>
        </button>

        <form onSubmit={handleSubmit} className="flex-1 flex gap-3">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite uma mensagem ou descreva um atendimento..."
            className="flex-1 p-3 rounded-md border-none focus:ring-0 text-sm shadow-sm"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="bg-[#00a884] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:bg-[#008f6f] transition-colors disabled:opacity-50"
          >
            <i className={`fa-solid ${input.trim() ? 'fa-paper-plane' : 'fa-microphone'}`}></i>
          </button>
        </form>
      </div>
    </div>
  );
};
