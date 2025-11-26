import React, { useState } from 'react';
import { AppMode } from './types';
import { LiveSession } from './components/LiveSession';
import { ScenarioPractice } from './components/ScenarioPractice';
import { Vocabulary } from './components/Vocabulary';
import { Mic, MessageSquare, Book, Code, Terminal } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);

  const renderContent = () => {
    switch (mode) {
      case AppMode.LIVE_CONVERSATION:
        return <LiveSession onEndSession={() => setMode(AppMode.DASHBOARD)} />;
      case AppMode.SCENARIO:
        return <ScenarioPractice onBack={() => setMode(AppMode.DASHBOARD)} />;
      case AppMode.VOCABULARY:
        return <Vocabulary onBack={() => setMode(AppMode.DASHBOARD)} />;
      default:
        return (
          <div className="max-w-4xl mx-auto p-6 animate-fade-in">
            <header className="mb-12 text-center">
              <div className="inline-flex items-center justify-center p-3 bg-blue-600/20 rounded-2xl mb-4">
                 <Terminal className="w-8 h-8 text-blue-400" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">DevEnglish Mentor</h1>
              <p className="text-slate-400">Yazılımcılar için özel olarak tasarlanmış İngilizce çalışma asistanı.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Live Speaking */}
              <button 
                onClick={() => setMode(AppMode.LIVE_CONVERSATION)}
                className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-3xl text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20"
              >
                <div className="relative z-10">
                  <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Canlı Pratik</h3>
                  <p className="text-blue-100 text-sm opacity-90">
                    Yapay zeka ile sesli konuş. Telaffuz ve akıcılık çalış.
                  </p>
                </div>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
              </button>

              {/* Card 2: Scenarios */}
              <button 
                onClick={() => setMode(AppMode.SCENARIO)}
                className="group relative overflow-hidden bg-slate-800 border border-slate-700 p-8 rounded-3xl text-left transition-all hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/10"
              >
                 <div className="relative z-10">
                  <div className="bg-purple-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                    <MessageSquare className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Senaryolar</h3>
                  <p className="text-slate-400 text-sm">
                    Standup, Code Review ve Mülakat simülasyonları ile yazış.
                  </p>
                </div>
              </button>

              {/* Card 3: Vocabulary */}
              <button 
                onClick={() => setMode(AppMode.VOCABULARY)}
                className="group relative overflow-hidden bg-slate-800 border border-slate-700 p-8 rounded-3xl text-left transition-all hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10"
              >
                <div className="relative z-10">
                  <div className="bg-emerald-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                    <Book className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Teknik Kelimeler</h3>
                  <p className="text-slate-400 text-sm">
                    Yazılım dünyasında sık kullanılan terimleri öğren.
                  </p>
                </div>
              </button>
            </div>

            <div className="mt-12 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-slate-500" />
                Günlük Çalışma Planı (1 Saat)
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl">
                    <div className="w-2 h-12 bg-emerald-500 rounded-full"></div>
                    <div>
                        <p className="text-white font-medium">1. Isınma & Kelime (10 dk)</p>
                        <p className="text-slate-400 text-sm">Teknik terimler kartlarını gözden geçir.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl">
                    <div className="w-2 h-12 bg-purple-500 rounded-full"></div>
                    <div>
                        <p className="text-white font-medium">2. Senaryo Bazlı Yazışma (20 dk)</p>
                        <p className="text-slate-400 text-sm">Code review veya Standup simülasyonu yap.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl">
                    <div className="w-2 h-12 bg-blue-500 rounded-full"></div>
                    <div>
                        <p className="text-white font-medium">3. Canlı Konuşma (30 dk)</p>
                        <p className="text-slate-400 text-sm">AI mentör ile sesli sohbet et ve geri bildirim al.</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
       {/* Main Content Area */}
       <main className="flex-1 overflow-auto relative">
         {renderContent()}
       </main>
    </div>
  );
};

export default App;