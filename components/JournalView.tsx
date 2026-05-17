import React, { useEffect, useState } from 'react';
import { Tab } from '../types';
import { getAllNotes, Note, getAllFavorites, Favorite } from '../services/api';
import { getBible, BibleBook } from '../services/bibleService';

interface JournalViewProps {
  onNavigate?: (tab: Tab) => void;
}

const JournalView: React.FC<JournalViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'NOTES' | 'SAVED'>('NOTES');
  const [loading, setLoading] = useState(true);
  const [localNotes, setLocalNotes] = useState<Note[]>([]);
  const [localVerseNotes, setLocalVerseNotes] = useState<{ key: string; ref: string; text: string }[]>([]);
  const [localFavorites, setLocalFavorites] = useState<Favorite[]>([]);
  const [bible, setBible] = useState<BibleBook[]>([]);

  // Load Bible books structure once for resolving deep links
  useEffect(() => {
    getBible()
      .then(setBible)
      .catch(err => console.error("Failed to load Bible books structure in JournalView", err));
  }, []);

  // Fetch data based on selected tab
  useEffect(() => {
    let isMounted = true;

    const loadNotes = async () => {
      setLoading(true);
      try {
        const notes = await getAllNotes();
        if (isMounted) setLocalNotes(notes);

        // Load verse-level independent notes from localStorage
        const savedVerseNotes = localStorage.getItem('user_verse_notes');
        if (savedVerseNotes) {
          try {
            const parsed = JSON.parse(savedVerseNotes);
            const formatted = Object.entries(parsed).map(([key, value]: [string, any]) => ({
              key,
              ref: value.ref,
              text: value.text
            }));
            if (isMounted) setLocalVerseNotes(formatted);
          } catch (e) {
            console.error(e);
            if (isMounted) setLocalVerseNotes([]);
          }
        } else {
          if (isMounted) setLocalVerseNotes([]);
        }
      } catch (error) {
        console.error("Failed to load notes", error);
        if (isMounted) {
          setLocalNotes([]);
          setLocalVerseNotes([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const loadFavorites = async () => {
      setLoading(true);
      try {
        const favorites = await getAllFavorites();
        if (isMounted) setLocalFavorites(favorites);
      } catch (error) {
        console.error("Failed to load favorites", error);
        if (isMounted) setLocalFavorites([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (activeTab === 'NOTES') {
      loadNotes();
    } else {
      loadFavorites();
    }

    const handleSync = () => {
      if (activeTab === 'NOTES') {
        loadNotes();
      }
    };
    window.addEventListener('verse-notes-updated', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('verse-notes-updated', handleSync);
    };
  }, [activeTab]);

  const handleNoteClick = (note: Note) => {
    // Navigate to the note's book and chapter
    const navKey = `${note.book_abbrev}-${note.chapter_index}`;
    localStorage.setItem('pending_nav_chapter', navKey);
    if (onNavigate) {
      onNavigate(Tab.READING);
    }
  };

  const handleVerseNoteClick = (vkey: string) => {
    // Navigate to the note's book and chapter (vkey is like "gn-0-1")
    const parts = vkey.split('-');
    if (parts.length >= 2) {
      const navKey = `${parts[0]}-${parts[1]}`;
      localStorage.setItem('pending_nav_chapter', navKey);
      if (onNavigate) {
        onNavigate(Tab.READING);
      }
    }
  };

  const handleFavoriteClick = (fav: Favorite) => {
    // Parse the reference (e.g. "Gênesis 1" or "1 João 3")
    // Match the text before the last number, and the last number
    const match = fav.verse_ref.match(/(.+)\s+(\d+)$/);
    if (match && bible.length > 0) {
      const bookName = match[1].trim().toLowerCase();
      const chapterNum = parseInt(match[2], 10);

      // Find book matching name or abbrev
      const book = bible.find(
        b => b.name.toLowerCase() === bookName || b.abbrev.toLowerCase() === bookName
      );

      if (book) {
        // Build Vite Reader Deep Link key: bookAbbrev-chapterIndex (0-indexed)
        const navKey = `${book.abbrev}-${chapterNum - 1}`;
        localStorage.setItem('pending_nav_chapter', navKey);
        if (onNavigate) {
          onNavigate(Tab.READING);
        }
      } else {
        console.warn("Could not find matching book for:", bookName);
      }
    } else {
      // Fallback: just open reader if parser fails
      if (onNavigate) onNavigate(Tab.READING);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark animate-in fade-in duration-300">
      
      {/* Top App Bar with Tabs Toggle */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center px-6 h-16 justify-between max-w-2xl mx-auto w-full">
          <button 
            onClick={() => onNavigate && onNavigate(Tab.READING)}
            className="w-10 h-10 flex items-center justify-start text-gray-400 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Toggle Tabs */}
          <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => {
                setActiveTab('NOTES');
                setLoading(true);
              }}
              className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'NOTES' 
                  ? 'bg-white dark:bg-[#332e18] text-[#1c1a0d] dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Minhas Notas
            </button>
            <button
              onClick={() => {
                setActiveTab('SAVED');
                setLoading(true);
              }}
              className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'SAVED' 
                  ? 'bg-white dark:bg-[#332e18] text-[#1c1a0d] dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Salvos
            </button>
          </div>

          <div className="flex w-10 items-center justify-end">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm text-gray-500">search</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-20 pb-32 max-w-2xl mx-auto px-6 w-full overflow-y-auto custom-scrollbar">
        <div className="space-y-4 pt-4">
          
          {/* Notes Tab View */}
          {activeTab === 'NOTES' && (
            loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (localNotes.length === 0 && localVerseNotes.length === 0) ? (
              <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gray-100 dark:bg-white/5 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5 border border-gray-200/50 dark:border-white/5">
                  <span className="material-symbols-outlined text-gray-400 text-4xl">edit_note</span>
                </div>
                <h3 className="font-bold text-[#1c1a0d] dark:text-white text-lg mb-1">Seu diário está vazio</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[280px] mx-auto leading-relaxed">
                  Navegue pelas Escrituras, selecione versículos e clique em "Anotar" para registrar suas reflexões pessoais.
                </p>
                <button 
                  onClick={() => onNavigate && onNavigate(Tab.READING)}
                  className="mt-6 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs px-5 py-2.5 rounded-full transition-all active:scale-[0.98]"
                >
                  Abrir Leitura
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Verse-level independent notes */}
                {localVerseNotes.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400 uppercase tracking-widest pl-1 mb-1">Anotações por Versículo</p>
                    <div className="grid gap-4">
                      {localVerseNotes.map((vnote) => (
                        <div
                          key={vnote.key}
                          onClick={() => handleVerseNoteClick(vnote.key)}
                          className="group bg-white dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/5 hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary transition-all"></div>
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-xl">edit_note</span>
                              <h4 className="font-serif font-bold text-[#1c1a0d] dark:text-white text-base leading-tight group-hover:text-primary transition-colors">
                                {vnote.ref}
                              </h4>
                            </div>
                            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors text-lg">
                              arrow_forward
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed p-3 bg-gray-50/50 dark:bg-black/10 rounded-xl border border-gray-100/50 dark:border-white/5 font-sans">
                            {vnote.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chapter reflections */}
                {localNotes.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-gray-400 uppercase tracking-widest pl-1 mb-1">Reflexões por Capítulo</p>
                    <div className="grid gap-4">
                      {localNotes.map((note, idx) => (
                        <div
                          key={note.id || idx}
                          onClick={() => handleNoteClick(note)}
                          className="group bg-white dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/5 hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary transition-all"></div>
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-xl">menu_book</span>
                              <h4 className="font-serif font-bold text-[#1c1a0d] dark:text-white text-base leading-tight group-hover:text-primary transition-colors">
                                {note.book_abbrev.toUpperCase()} - Capítulo {note.chapter_index + 1}
                              </h4>
                            </div>
                            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors text-lg">
                              arrow_forward
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed p-3 bg-gray-50/50 dark:bg-black/10 rounded-xl border border-gray-100/50 dark:border-white/5 font-sans line-clamp-4">
                            {note.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* Saved Tab View (Favorites) */}
          {activeTab === 'SAVED' && (
            loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : localFavorites.length === 0 ? (
              <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gray-100 dark:bg-white/5 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5 border border-gray-200/50 dark:border-white/5">
                  <span className="material-symbols-outlined text-gray-400 text-4xl">bookmarks</span>
                </div>
                <h3 className="font-bold text-[#1c1a0d] dark:text-white text-lg mb-1">Nenhum capítulo salvo</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[280px] mx-auto leading-relaxed">
                  Clique no ícone de marcador ou de estrela durante a leitura para salvar seus capítulos preferidos aqui.
                </p>
                <button 
                  onClick={() => onNavigate && onNavigate(Tab.READING)}
                  className="mt-6 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs px-5 py-2.5 rounded-full transition-all active:scale-[0.98]"
                >
                  Explorar a Bíblia
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest pl-1 mb-2">Seus Capítulos e Versículos Salvos</p>
                <div className="grid gap-4">
                  {localFavorites.map((fav, idx) => (
                    <div
                      key={fav.id || idx}
                      onClick={() => handleFavoriteClick(fav)}
                      className="group bg-white dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/5 hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary transition-all"></div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary filled-icon text-xl">bookmark</span>
                          <h4 className="font-serif font-bold text-[#1c1a0d] dark:text-white text-lg leading-tight group-hover:text-primary transition-colors">
                            {fav.verse_ref}
                          </h4>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors text-lg">
                          arrow_forward
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-2 italic bg-gray-50/50 dark:bg-black/10 p-3 rounded-xl border border-gray-100/50 dark:border-white/5 font-sans">
                        "{fav.text}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

        </div>
      </main>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-24 right-6 z-40">
        <button 
          onClick={() => onNavigate && onNavigate(Tab.READING)}
          className="bg-primary hover:bg-[#d9ba0b] text-[#1c1a0d] w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform group"
          title="Escrever nova anotação"
        >
          <span className="material-symbols-outlined text-3xl font-bold transition-transform group-hover:rotate-90 duration-300">add</span>
        </button>
      </div>
    </div>
  );
};

export default JournalView;
