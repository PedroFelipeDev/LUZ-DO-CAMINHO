import React, { useState } from 'react';
import { toggleFavorite } from '../services/api';

const ReadingView: React.FC = () => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFavorite = async () => {
    setIsLoading(true);
    try {
      // Exemplo fixo para Gênesis 1
      const newState = await toggleFavorite("Gênesis 1", "No princípio, criou Deus os céus e a terra...");
      setIsFavorite(newState);
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center justify-between px-4 h-16 max-w-2xl mx-auto w-full">
          <button className="flex items-center gap-1 text-[#1c1a0d] dark:text-[#fcfbf8] font-bold text-lg hover:opacity-70 transition-opacity">
            Gênesis 1
            <span className="material-symbols-outlined text-primary text-2xl">expand_more</span>
          </button>
          <div className="flex items-center gap-4">
            <button className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined">text_fields</span>
            </button>
            <button className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined">bookmark</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-32 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Headline Section */}
          <div className="px-6 pt-10 pb-4">
            <h1 className="font-serif text-4xl font-bold text-[#1c1a0d] dark:text-[#fcfbf8] leading-tight">
              A Criação do Mundo
            </h1>
            <div className="h-1 w-12 bg-primary mt-4 rounded-full"></div>
          </div>

          {/* Scripture Content */}
          <article className="px-6 py-4 font-serif text-xl leading-relaxed space-y-8 text-justify text-[#1c1a0d] dark:text-[#e0e0e0]">
            <p>
              <span className="float-left text-6xl font-bold text-primary mr-3 mt-2 leading-none">N</span>o princípio, criou Deus os céus e a terra. <sup className="text-xs text-primary font-bold mr-1">2</sup>E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o Espírito de Deus se movia sobre a face das águas.
            </p>
            <p>
              <sup className="text-xs text-primary font-bold mr-1">3</sup>E disse Deus: Haja luz; e houve luz. <sup className="text-xs text-primary font-bold mr-1">4</sup>E viu Deus que era boa a luz; e fez Deus separação entre a luz e as trevas.
            </p>
            <p>
              <sup className="text-xs text-primary font-bold mr-1">5</sup>E Deus chamou à luz Dia; e às trevas chamou Noite. E foi a tarde e a manhã, o dia primeiro.
            </p>
            <p>
              <sup className="text-xs text-primary font-bold mr-1">6</sup>E disse Deus: Haja uma expansão no meio das águas, e haja separação entre águas e águas. <sup className="text-xs text-primary font-bold mr-1">7</sup>E fez Deus a expansão, e fez separação entre as águas que estavam debaixo da expansão e as águas que estavam sobre a expansão; e assim foi.
            </p>
            <p>
              <sup className="text-xs text-primary font-bold mr-1">8</sup>E chamou Deus à expansão Céus, e foi a tarde e a manhã, o dia segundo.
            </p>
          </article>

          {/* Quick Actions Bar */}
          <div className="px-6 py-8">
            <div className="flex items-center justify-around bg-primary/10 dark:bg-primary/5 rounded-2xl p-4">
              <button className="flex flex-col items-center gap-1 group">
                <div className="bg-white dark:bg-[#332e18] p-3 rounded-full shadow-sm group-active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-[#1c1a0d] dark:text-[#fcfbf8]">share</span>
                </div>
                <span className="text-xs font-medium text-[#1c1a0d] dark:text-[#fcfbf8]">Compartilhar</span>
              </button>
              <button className="flex flex-col items-center gap-1 group">
                <div className="bg-white dark:bg-[#332e18] p-3 rounded-full shadow-sm group-active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-[#1c1a0d] dark:text-[#fcfbf8]">edit_note</span>
                </div>
                <span className="text-xs font-medium text-[#1c1a0d] dark:text-[#fcfbf8]">Anotar</span>
              </button>
              <button
                onClick={handleFavorite}
                disabled={isLoading}
                className={`flex flex-col items-center gap-1 group ${isLoading ? 'opacity-50' : ''}`}
              >
                <div className="bg-white dark:bg-[#332e18] p-3 rounded-full shadow-sm group-active:scale-95 transition-all">
                  <span className={`material-symbols-outlined ${isFavorite ? 'text-primary filled-icon' : 'text-[#1c1a0d] dark:text-[#fcfbf8]'}`}>
                    star
                  </span>
                </div>
                <span className="text-xs font-medium text-[#1c1a0d] dark:text-[#fcfbf8]">
                  {isFavorite ? 'Favorito' : 'Favoritar'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReadingView;
