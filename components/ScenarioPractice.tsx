import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, RefreshCw } from 'lucide-react';
import { ai, MODELS } from '../services/gemini';
import { ChatMessage } from '../types';

interface ScenarioPracticeProps {
  onBack: () => void;
}

const SCENARIOS = [
  "Daily Standup Meeting",
  "Code Review Discussion",
  "Explaining a Bug to a PM",
  "Job Interview: Technical Questions"
];

export const ScenarioPractice: React.FC<ScenarioPracticeProps> = ({ onBack }) => {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatSession, setChatSession] = useState<any>(null);

  const startScenario = async (scenario: string) => {
    setSelectedScenario(scenario);
    setIsLoading(true);
    setMessages([]);

    try {
      const chat = ai.chats.create({
        model: MODELS.TEXT,
        config: {
          systemInstruction: `You are acting as a colleague or interviewer in a ${scenario}. 
          Your goal is to have a realistic conversation with a Junior Software Engineer (the user).
          Keep your responses concise (under 50 words) to encourage back-and-forth.
          After the user replies, if they make a grammar mistake, correct it inside parentheses at the end of your response like this: (Correction: ...)
          Start the conversation now by asking the first question relevant to ${scenario}.`
        }
      });
      setChatSession(chat);

      // Trigger the opening message
      const result = await chat.sendMessage({ message: "Start the simulation." });
      
      setMessages([{
        id: Date.now().toString(),
        role: 'model',
        text: result.text,
        timestamp: Date.now()
      }]);

    } catch (error) {
      console.error("Error starting chat", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !chatSession) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const result = await chatSession.sendMessage({ message: userMsg.text });
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedScenario) {
    return (
      <div className="p-6 max-w-4xl mx-auto w-full">
        <button onClick={onBack} className="mb-4 text-slate-400 hover:text-white">← Geri</button>
        <h2 className="text-3xl font-bold mb-6 text-white">Senaryo Seçimi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCENARIOS.map((s) => (
            <button
              key={s}
              onClick={() => startScenario(s)}
              className="p-6 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 hover:border-blue-500 transition-all text-left"
            >
              <h3 className="text-xl font-semibold text-blue-400 mb-2">{s}</h3>
              <p className="text-slate-400 text-sm">Pratik yap: {s}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10">
        <div className="flex items-center gap-3">
            <button onClick={() => setSelectedScenario(null)} className="text-slate-400 hover:text-white text-sm">
                ← Çıkış
            </button>
            <h3 className="font-semibold text-white">{selectedScenario}</h3>
        </div>
        <button 
            onClick={() => startScenario(selectedScenario)}
            className="text-slate-400 hover:text-blue-400" 
            title="Restart"
        >
            <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600/20 text-blue-50 border border-blue-500/30' 
                  : 'bg-slate-800 text-slate-100 border border-slate-700'
              }`}>
                {msg.text.split('(Correction:').map((part, i) => (
                     i === 0 ? <p key={i}>{part}</p> : <p key={i} className="mt-2 text-yellow-400 text-sm italic border-t border-slate-600 pt-2">Correction: {part.replace(')', '')}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                 <div className="bg-slate-800 p-4 rounded-2xl ml-11">
                    <span className="animate-pulse">Yazıyor...</span>
                 </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Cevabınızı buraya yazın..."
            className="flex-1 bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};