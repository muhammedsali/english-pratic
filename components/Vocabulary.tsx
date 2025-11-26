import React, { useState, useEffect } from 'react';
import { ai, MODELS } from '../services/gemini';
import { Type } from '@google/genai';
import { VocabularyItem } from '../types';
import { BookOpen, RefreshCw, Check, ArrowRight } from 'lucide-react';

interface VocabularyProps {
    onBack: () => void;
}

export const Vocabulary: React.FC<VocabularyProps> = ({ onBack }) => {
    const [items, setItems] = useState<VocabularyItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);

    const fetchVocabulary = async () => {
        setLoading(true);
        setItems([]);
        try {
            const response = await ai.models.generateContent({
                model: MODELS.TEXT,
                contents: "Generate 5 advanced English vocabulary words specifically useful for software engineers (mix of technical verbs and professional adjectives). Return JSON.",
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                term: { type: Type.STRING },
                                definition: { type: Type.STRING },
                                example: { type: Type.STRING }
                            },
                            required: ["term", "definition", "example"]
                        }
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                setItems(data);
                setCurrentIndex(0);
                setFlipped(false);
            }
        } catch (e) {
            console.error("Vocab fetch error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVocabulary();
    }, []);

    const nextCard = () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setFlipped(false);
        } else {
            fetchVocabulary(); // Get new batch
        }
    };

    return (
        <div className="flex flex-col h-full p-6 max-w-2xl mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
                 <button onClick={onBack} className="text-slate-400 hover:text-white">← Geri</button>
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="text-purple-400" />
                    Teknik Kelime Kartları
                 </h2>
                 <button onClick={fetchVocabulary} className="text-slate-400 hover:text-white">
                    <RefreshCw className="w-5 h-5" />
                 </button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
            ) : items.length > 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div 
                        className="w-full h-80 relative cursor-pointer perspective-1000 group"
                        onClick={() => setFlipped(!flipped)}
                    >
                         <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${flipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                            {/* Front */}
                            <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl">
                                <span className="text-slate-400 text-sm uppercase tracking-wider mb-4">Word</span>
                                <h3 className="text-5xl font-bold text-white text-center">{items[currentIndex].term}</h3>
                                <p className="mt-8 text-slate-500 text-sm">Tap to see definition</p>
                            </div>

                            {/* Back */}
                            <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-purple-900/50 to-slate-900 border-2 border-purple-500/50 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl rotate-y-180" style={{ transform: 'rotateY(180deg)' }}>
                                <span className="text-purple-400 text-sm uppercase tracking-wider mb-2">Definition</span>
                                <p className="text-xl text-white text-center font-medium mb-6">{items[currentIndex].definition}</p>
                                
                                <div className="bg-slate-800/50 p-4 rounded-xl w-full">
                                    <span className="text-xs text-slate-400 block mb-1">Example:</span>
                                    <p className="text-slate-300 italic text-center">"{items[currentIndex].example}"</p>
                                </div>
                            </div>
                         </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <button 
                            onClick={nextCard}
                            className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
                        >
                            {currentIndex === items.length - 1 ? 'Sonraki Set' : 'Sonraki Kelime'}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                     <p className="mt-4 text-slate-500 text-sm">
                        {currentIndex + 1} / {items.length}
                    </p>
                </div>
            ) : (
                <div className="text-center text-slate-400">Veri alınamadı.</div>
            )}
        </div>
    );
};