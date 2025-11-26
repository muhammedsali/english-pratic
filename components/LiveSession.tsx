import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ai, MODELS, SYSTEM_INSTRUCTION_TUTOR } from '../services/gemini';
import { createBlob, decode, decodeAudioData } from '../services/audioUtils';
import { LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Volume2, XCircle } from 'lucide-react';

interface LiveSessionProps {
  onEndSession: () => void;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ onEndSession }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<string>("Hazır");
  const [volume, setVolume] = useState(0); // For visualization
  
  // Refs for audio handling to persist across renders
  const nextStartTimeRef = useRef<number>(0);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null); // To hold the session promise result

  // Cleanup function to stop audio contexts and streams
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Stop all playing sources
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    sourcesRef.current.clear();

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    
    if (sessionRef.current) {
        // Try to close session if method exists (it might not depending on SDK version implementation)
        // Using "close" event logic from prompt implies we handle it, but prompt says use session.close()
        try { sessionRef.current.close(); } catch (e) { /* ignore */ }
        sessionRef.current = null;
    }

    setIsActive(false);
    setStatus("Oturum sonlandırıldı.");
  }, []);

  const startSession = async () => {
    try {
      setStatus("Bağlanıyor...");
      
      // Initialize Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup Gemini Live Connection
      const sessionPromise = ai.live.connect({
        model: MODELS.LIVE,
        callbacks: {
          onopen: () => {
            setStatus("Bağlandı! Konuşabilirsiniz.");
            setIsActive(true);

            // Audio Pipeline: Mic -> ScriptProcessor -> Gemini
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for visualization
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(rms * 5, 1)); // Scale for UI

              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Audio Output Handling
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
               // Ensure output context is running (browsers suspend audio contexts until user interaction)
               if (outputCtx.state === 'suspended') {
                 await outputCtx.resume();
               }

               nextStartTimeRef.current = Math.max(
                 nextStartTimeRef.current,
                 outputCtx.currentTime
               );

               const audioBuffer = await decodeAudioData(
                 decode(base64Audio),
                 outputCtx,
                 24000,
                 1
               );

               const source = outputCtx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputNode);
               
               source.addEventListener('ended', () => {
                 sourcesRef.current.delete(source);
               });

               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach((src) => {
                try { src.stop(); } catch(e) {/* ignore */}
                sourcesRef.current.delete(src);
              });
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            setStatus("Bağlantı kesildi.");
            setIsActive(false);
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            setStatus("Hata oluştu. Lütfen tekrar deneyin.");
            setIsActive(false);
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            systemInstruction: SYSTEM_INSTRUCTION_TUTOR
        }
      });

      // Save session promise result so we can close it later
      sessionPromise.then(sess => {
          sessionRef.current = sess;
      });

    } catch (error) {
      console.error("Initialization error:", error);
      setStatus("Mikrofon hatası veya API hatası.");
      cleanup();
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in">
      <div className="relative mb-8">
        {/* Pulsing visualizer circle */}
        <div 
            className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-100 ${isActive ? 'bg-blue-600/20' : 'bg-slate-800'}`}
            style={{ transform: `scale(${1 + volume * 0.5})` }}
        >
          <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 ${isActive ? 'bg-blue-500 shadow-blue-500/50' : 'bg-slate-700'}`}>
            <Volume2 className={`w-12 h-12 ${isActive ? 'text-white' : 'text-slate-400'}`} />
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-2 text-white">{isActive ? "Dinliyorum..." : "Konuşma Pratiği"}</h2>
      <p className="text-slate-400 mb-8 text-center max-w-md">
        {status}
      </p>

      <div className="flex gap-4">
        {!isActive ? (
          <button 
            onClick={startSession}
            className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-green-500/25"
          >
            <Mic className="w-5 h-5" />
            Başlat
          </button>
        ) : (
          <button 
            onClick={cleanup}
            className="flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-red-500/25"
          >
            <MicOff className="w-5 h-5" />
            Bitir
          </button>
        )}
      </div>

      <button 
        onClick={onEndSession}
        className="mt-12 text-slate-500 hover:text-slate-300 flex items-center gap-2 text-sm"
      >
        <XCircle className="w-4 h-4" />
        Ana Menüye Dön
      </button>
    </div>
  );
};
