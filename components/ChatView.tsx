import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { sendMessageStream, initChatSession } from '../services/geminiService';
import { GenerateContentResponse } from "@google/genai";
import { saveChatMessage, getChatHistory } from '../services/api';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Olá! Como posso ajudar você a entender as Escrituras hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat session and load history
  useEffect(() => {
    initChatSession();

    const loadHistory = async () => {
      const history = await getChatHistory();
      if (history.length > 0) {
        const formattedMessages: Message[] = history.map(msg => ({
          id: msg.id?.toString() || Date.now().toString(),
          role: msg.role,
          text: msg.text
        }));
        setMessages(formattedMessages);
      }
    };
    loadHistory();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Persist User Message
    saveChatMessage('user', textToSend);

    try {
      const streamResult = await sendMessageStream(textToSend);

      const botMessageId = (Date.now() + 1).toString();
      let fullText = "";

      // Add placeholder message
      setMessages(prev => [...prev, {
        id: botMessageId,
        role: 'model',
        text: '',
        isStreaming: true
      }]);

      for await (const chunk of streamResult) {
        const responseChunk = chunk as GenerateContentResponse;
        const text = responseChunk.text || "";
        fullText += text;

        setMessages(prev => prev.map(msg =>
          msg.id === botMessageId
            ? { ...msg, text: fullText }
            : msg
        ));
      }

      // Persist AI Response
      await saveChatMessage('model', fullText);

      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? { ...msg, isStreaming: false }
          : msg
      ));

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Desculpe, tive um problema ao conectar. Por favor, tente novamente."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { icon: 'auto_awesome', text: 'Explique João 3:16' },
    { icon: 'light_mode', text: 'Versículos sobre esperança' },
    { icon: 'favorite', text: 'O que é graça?' }
  ];

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* TopAppBar */}
      <header className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 border-b border-gray-100 dark:border-gray-800 justify-between">
        <div className="text-[#1c1a0d] dark:text-white flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </div>
        <h2 className="text-[#1c1a0d] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Conversar com a Bíblia</h2>
        <div className="size-10"></div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-48">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 shrink-0 shadow-sm border border-gray-200 dark:border-gray-700"
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBVo2xwlakoqdG5uBzghznvq7-wkBTEYfhVyFT6fJS9OupTlow-I-yp3KgEiH99gs7mfZN1aXn6HZ3qrstQ-TOdc8dFz23Maf8vT9FGWw92sP6zrLG3EkdKJvPmzXigXOGaluDUf0Lub3NC8j6jAcHM5SY2hAN_rWwvxtA2q7TwHvur82PgbcP4FWACWVSV42xbhEG1GYC5t4_FhcERkhF64NqxfxJPIjcdrRcI7olqL40VfnzsY9m8LUXjAfrfu0Nqa0fkNoyM9g")' }}
              ></div>
            )}

            <div className={`flex flex-1 flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <p className="text-[#9c9049] text-[12px] font-medium leading-normal mx-1">
                {msg.role === 'user' ? 'Você' : 'Bíblia AI'}
              </p>
              <div className={`text-base font-normal leading-relaxed max-w-[85%] rounded-2xl px-4 py-3 shadow-sm border
                  ${msg.role === 'user'
                  ? 'rounded-br-none bg-chat-user dark:bg-primary/20 text-[#1c1a0d] dark:text-primary border-primary/20'
                  : 'rounded-bl-none bg-white dark:bg-gray-800 text-[#1c1a0d] dark:text-gray-100 border-gray-100 dark:border-gray-700'
                }
                `}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                {msg.isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse"></span>}
              </div>
            </div>

            {msg.role === 'user' && (
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 shrink-0 shadow-sm border border-gray-200 dark:border-gray-700"
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCnIsj8R3TygrfZRd4U563-Zq4RcryXyiowgiz_-p_SO8QfLBrdA0xEkJkzIvYeSzrB2MVNf515nG-hBGdOLfEP_WwpdqjMclldJFmZEUwFMUPFV99G36WDCjVhUWxT6gB00y5g3R5_zH1okY-yD2p65fRVftsTfF-YAA4D_R7ZyRnNWBpUhQR4sh8E4ic5NOTRog-6UbCRDyrkDHqONe5ePj5tZz1mv7y4YiJxN7hlCz1ynxmtcy0FoGIXahDkhb-bHjF1Ww_bJA")' }}
              ></div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Bottom Actions & Input */}
      <div className="absolute bottom-0 left-0 w-full bg-background-light dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 pb-[80px]">
        {/* Suggestion Chips */}
        <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar whitespace-nowrap">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(suggestion.text)}
              className="flex h-9 items-center justify-center gap-x-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95"
            >
              <span className="material-symbols-outlined text-primary text-lg">{suggestion.icon}</span>
              <span className="text-[#1c1a0d] dark:text-gray-200 text-sm font-medium">{suggestion.text}</span>
            </button>
          ))}
        </div>

        {/* Input Field */}
        <div className="px-4 py-2 flex items-center gap-3 bg-background-light dark:bg-background-dark">
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full h-12 rounded-full border-2 border-primary bg-white dark:bg-gray-800 px-5 pr-12 text-base focus:outline-none focus:ring-0 focus:border-primary transition-all shadow-sm dark:text-white dark:placeholder-gray-400"
              placeholder="Pergunte sobre as Escrituras..."
              type="text"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="absolute right-1 top-1 size-10 flex items-center justify-center bg-primary rounded-full text-white shadow-md active:scale-90 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
