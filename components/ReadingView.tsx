import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toggleFavorite, saveNote, getNote, logReading, checkFavorite } from '../services/api';
import { supabase } from '../services/supabase';

// ... (imports remain the same, just adding saveNote, getNote)

// ...



import { getBible, BibleBook } from '../services/bibleService';

interface RenderedChapter {
  bookAbbrev: string;
  bookName: string;
  chapterIndex: number;
  verses: string[];
  key: string; // Unique key for rendering (e.g., "gn-0")
}

type ModalStep = 'BOOKS' | 'CHAPTERS' | 'VERSES';

// Helper for formatting abbreviations
const formatAbbrev = (abbrev: string): string => {
  if (!abbrev) return '';

  // Check if starts with digit
  const match = abbrev.match(/^(\d+)([a-z]+)$/i);
  if (match) {
    return `${match[1]}${match[2].charAt(0).toUpperCase()}${match[2].slice(1)}`;
  }

  // Otherwise just title case first char
  return abbrev.charAt(0).toUpperCase() + abbrev.slice(1);
};

export interface SelectedVerseInfo {
  id: string;
  bookName: string;
  chapterNum: number;
  verseNum: number;
  text: string;
}

const VerseParagraph: React.FC<{
  verseKey: string;
  verse: string;
  vIdx: number;
  fontSize: 'normal' | 'large' | 'xlarge';
  isSelected: boolean;
  isSelectionActive: boolean;
  onToggleSelection: (key: string, info: SelectedVerseInfo) => void;
  bookName: string;
  chapterIndex: number;
  isHighlighted: boolean;
  hasNote: boolean;
}> = ({ verseKey, verse, vIdx, fontSize, isSelected, isSelectionActive, onToggleSelection, bookName, chapterIndex, isHighlighted, hasNote }) => {
  const timerRef = useRef<any>(null);
  const preventClickRef = useRef(false);

  const startPress = () => {
    preventClickRef.current = false;
    if (isSelectionActive) return;

    timerRef.current = setTimeout(() => {
      preventClickRef.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      onToggleSelection(verseKey, {
        id: verseKey,
        bookName,
        chapterNum: chapterIndex + 1,
        verseNum: vIdx + 1,
        text: verse
      });
    }, 2000); // 2 seconds long press
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isSelectionActive) {
      onToggleSelection(verseKey, {
        id: verseKey,
        bookName,
        chapterNum: chapterIndex + 1,
        verseNum: vIdx + 1,
        text: verse
      });
    }
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <p
      id={`verse-${verseKey}`}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchMove={cancelPress}
      className={`transition-all duration-300 rounded px-2.5 py-1.5 relative cursor-pointer select-none ${
        isSelected 
          ? 'bg-primary/25 border-l-4 border-primary pl-4' 
          : isHighlighted
            ? 'bg-yellow-200/40 dark:bg-yellow-500/15 border-l-4 border-yellow-400/70 pl-4 shadow-sm'
            : 'hover:bg-gray-100/50 dark:hover:bg-white/5'
      }`}
    >
      <sup className="text-xs text-primary font-bold mr-1 align-top inline-flex items-center gap-0.5">
        {vIdx + 1}
        {hasNote && (
          <span className="material-symbols-outlined text-[10px] text-primary font-bold filled-icon">edit_note</span>
        )}
      </sup>
      {vIdx === 0 ? (
        <>
          <span className="float-left font-bold text-primary mr-2 leading-[0.8] mt-2 mb-[-8px]" style={{ fontSize: fontSize === 'xlarge' ? '4.5rem' : fontSize === 'large' ? '4rem' : '3.5rem' }}>
            {verse.charAt(0)}
          </span>
          {verse.substring(1)}
        </>
      ) : (
        verse
      )}
    </p>
  );
};

// Sub-component to handle individual chapter state (actions)
const ChapterSection: React.FC<{
  chapter: RenderedChapter;
  onAnnotate: (chapter: RenderedChapter) => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  selectedVerses: { [key: string]: SelectedVerseInfo };
  onToggleSelection: (key: string, info: SelectedVerseInfo) => void;
  isSelectionMode: boolean;
  highlights: { [key: string]: boolean };
  verseNotes: { [key: string]: { ref: string; text: string } };
}> = ({ chapter, onAnnotate, fontSize, selectedVerses, onToggleSelection, isSelectionMode, highlights, verseNotes }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check initial favorite status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const ref = `${chapter.bookName} ${chapter.chapterIndex + 1}`;
        const isFav = await checkFavorite(ref);
        setIsFavorite(isFav);
      } catch (error) {
        console.error("Failed to check favorite status", error);
      }
    };
    checkStatus();

    // Listen for global updates (e.g. from header)
    const handleUpdate = (e: any) => {
      const ref = `${chapter.bookName} ${chapter.chapterIndex + 1}`;
      if (e.detail.ref === ref) {
        setIsFavorite(e.detail.isFavorite);
      }
    };
    window.addEventListener('favorite-updated', handleUpdate);
    return () => window.removeEventListener('favorite-updated', handleUpdate);
  }, [chapter.bookName, chapter.chapterIndex]);

  const handleFavorite = async () => {
    setIsLoading(true);
    try {
      const ref = `${chapter.bookName} ${chapter.chapterIndex + 1}`;
      const preview = chapter.verses[0].substring(0, 50) + "...";
      const newState = await toggleFavorite(ref, preview);
      setIsFavorite(newState);

      // Dispatch event to update other components (header)
      window.dispatchEvent(new CustomEvent('favorite-updated', {
        detail: { ref, isFavorite: newState }
      }));

    } catch (error) {
      console.error("Failed to toggle favorite", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const title = `${chapter.bookName} ${chapter.chapterIndex + 1}`;
    const text = `${title}\n\n${chapter.verses.map((v, i) => `${i + 1}. ${v}`).join('\n')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text.substring(0, 2000) + (text.length > 2000 ? '...' : ''), // Limit checks
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(text);
        alert("Capítulo copiado para a área de transferência!");
      } catch (err) {
        console.error("Clipboard failed", err);
        alert("Erro ao copiar para área de transferência.");
      }
    }
  };

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      alert("Você precisa estar logado para realizar esta ação. Vá ao Perfil para entrar.");
      return false;
    }
    return true;
  };

  const handleFavoriteAction = async () => {
    if (!await checkAuth()) return;

    await handleFavorite();
  };

  const handleAnnotateAction = async () => {
    if (!await checkAuth()) return;
    onAnnotate(chapter);
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large': return 'text-2xl leading-loose';
      case 'xlarge': return 'text-3xl leading-loose';
      default: return 'text-xl leading-relaxed';
    }
  };

  return (
    <section id={`chapter-${chapter.key}`} data-key={chapter.key} className="scroll-mt-20">
      <div className="mb-4">
        <h2 className="font-serif text-3xl font-bold text-[#1c1a0d] dark:text-[#fcfbf8] leading-tight">
          {chapter.bookName} {chapter.chapterIndex + 1}
        </h2>
        <div className="h-1 w-12 bg-primary mt-2 rounded-full"></div>
      </div>

      <article className={`font-serif text-justify text-[#1c1a0d] dark:text-[#e0e0e0] space-y-4 ${getFontSizeClass()}`}>
        {chapter.verses.map((verse, vIdx) => {
          const verseKey = `${chapter.key}-${vIdx + 1}`;
          const isSelected = !!selectedVerses[verseKey];
          const isHighlighted = !!highlights[verseKey];
          const hasNote = !!verseNotes[verseKey];

          return (
            <VerseParagraph
              key={vIdx}
              verseKey={verseKey}
              verse={verse}
              vIdx={vIdx}
              fontSize={fontSize}
              isSelected={isSelected}
              isSelectionActive={isSelectionMode}
              onToggleSelection={onToggleSelection}
              bookName={chapter.bookName}
              chapterIndex={chapter.chapterIndex}
              isHighlighted={isHighlighted}
              hasNote={hasNote}
            />
          );
        })}
      </article>

      {/* Quick Actions Bar */}
      <div className="px-6 py-8">
        <div className="flex items-center justify-around bg-primary/10 dark:bg-primary/5 rounded-2xl p-4">
          <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
            <div className="bg-white dark:bg-[#332e18] p-3 rounded-full shadow-sm group-active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[#1c1a0d] dark:text-[#fcfbf8]">share</span>
            </div>
            <span className="text-xs font-medium text-[#1c1a0d] dark:text-[#fcfbf8]">Compartilhar</span>
          </button>
          <button onClick={handleAnnotateAction} className="flex flex-col items-center gap-1 group">
            <div className="bg-white dark:bg-[#332e18] p-3 rounded-full shadow-sm group-active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[#1c1a0d] dark:text-[#fcfbf8]">edit_note</span>
            </div>
            <span className="text-xs font-medium text-[#1c1a0d] dark:text-[#fcfbf8]">Anotar</span>
          </button>
          <button
            onClick={handleFavoriteAction}
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
    </section>
  );
};

interface ReadingViewProps {
  onModalToggle?: (isOpen: boolean) => void;
}

const ReadingView: React.FC<ReadingViewProps> = ({ onModalToggle }) => {
  const [bible, setBible] = useState<BibleBook[]>([]);
  const [renderedChapters, setRenderedChapters] = useState<RenderedChapter[]>([]);

  // Selection State
  const [selectedVerses, setSelectedVerses] = useState<{ [key: string]: SelectedVerseInfo }>({});
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [swapConfirmOpen, setSwapConfirmOpen] = useState(false);
  const [pendingSwapData, setPendingSwapData] = useState<{ key: string, info: SelectedVerseInfo } | null>(null);
  const [highlights, setHighlights] = useState<{ [key: string]: boolean }>({});
  const [verseNoteModalOpen, setVerseNoteModalOpen] = useState(false);
  const [activeVerseNoteKey, setActiveVerseNoteKey] = useState<string | null>(null);
  const [activeVerseNoteRef, setActiveVerseNoteRef] = useState<string>("");
  const [currentVerseNoteText, setCurrentVerseNoteText] = useState("");
  const [verseNotes, setVerseNotes] = useState<{ [key: string]: { ref: string; text: string } }>({});

  const isAllHighlighted = Object.keys(selectedVerses).length > 0 &&
    Object.keys(selectedVerses).every(key => highlights[key]);

  // Load verse notes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('user_verse_notes');
    if (saved) {
      try {
        setVerseNotes(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Load and apply theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      setIsDarkMode(false);
    }
  }, []);

  // Load highlights from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('user_highlights');
    if (saved) {
      try {
        setHighlights(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Navigation State
  const [currentTitle, setCurrentTitle] = useState("Carregando...");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('BOOKS');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number | null>(null);

  useEffect(() => {
    onModalToggle?.(modalOpen);
    return () => {
      onModalToggle?.(false);
    };
  }, [modalOpen, onModalToggle]);

  // Note Modal State
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState("");
  const [activeNoteChapter, setActiveNoteChapter] = useState<RenderedChapter | null>(null);

  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [headerIsFavorite, setHeaderIsFavorite] = useState(false);
  // Track the key of the chapter currently driving the title/focus
  const [activeChapterKey, setActiveChapterKey] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  // Sync header favorite button with active chapter logic
  useEffect(() => {
    const syncHeaderFavorite = async () => {
      if (!activeChapterKey) return;
      const chapter = renderedChapters.find(c => c.key === activeChapterKey);
      if (!chapter) return;

      try {
        const ref = `${chapter.bookName} ${chapter.chapterIndex + 1}`;
        const isFav = await checkFavorite(ref);
        setHeaderIsFavorite(isFav);
      } catch (e) { console.error(e); }
    };
    syncHeaderFavorite();
  }, [activeChapterKey, renderedChapters]);

  // Listen for favorite updates from children
  useEffect(() => {
    const handleFavUpdate = (e: any) => {
      // If the updated favorite matches our active chapter, update header
      if (activeChapterKey) {
        const chapter = renderedChapters.find(c => c.key === activeChapterKey);
        if (chapter && e.detail.ref === `${chapter.bookName} ${chapter.chapterIndex + 1}`) {
          setHeaderIsFavorite(e.detail.isFavorite);
        }
      }
    };
    window.addEventListener('favorite-updated', handleFavUpdate);
    return () => window.removeEventListener('favorite-updated', handleFavUpdate);
  }, [activeChapterKey, renderedChapters]);


  // --- Selection Actions ---
  const handleToggleSelection = (key: string, info: SelectedVerseInfo) => {
    setIsSelectionMode(true);
    
    // Check if selecting a different chapter
    const keys = Object.keys(selectedVerses);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const selectedChapterKey = firstKey.substring(0, firstKey.lastIndexOf('-'));
      const currentChapterKey = key.substring(0, key.lastIndexOf('-'));

      if (selectedChapterKey !== currentChapterKey) {
        // Different chapter! Always open custom React modal with "Sim" / "Cancelar"
        setPendingSwapData({ key, info });
        setSwapConfirmOpen(true);
        return;
      }
    }

    // Same chapter, standard toggle
    setSelectedVerses(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = info;
      }
      return next;
    });
  };

  const formatSelectedRef = () => {
    const sorted = Object.values(selectedVerses).sort((a, b) => a.verseNum - b.verseNum);
    if (sorted.length === 0) return "";
    const first = sorted[0];
    const bookAndChapter = `${first.bookName} ${first.chapterNum}`;
    
    const nums = sorted.map(v => v.verseNum);
    const ranges: string[] = [];
    let start = nums[0];
    let prev = nums[0];
    
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] === prev + 1) {
        prev = nums[i];
      } else {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = nums[i];
        prev = nums[i];
      }
    }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    
    return `${bookAndChapter}:${ranges.join(', ')}`;
  };

  const formatSelectedText = () => {
    const sorted = Object.values(selectedVerses).sort((a, b) => a.verseNum - b.verseNum);
    return sorted.map(v => `${v.verseNum}. ${v.text}`).join('\n');
  };

  const handleSaveSelected = async () => {
    if (Object.keys(selectedVerses).length === 0) {
      alert("Por favor, selecione pelo menos um versículo para salvar.");
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      alert("Você precisa estar logado para salvar versículos. Vá ao Perfil para entrar.");
      return;
    }

    const ref = formatSelectedRef();
    const text = formatSelectedText();

    try {
      const success = await toggleFavorite(ref, text);
      if (success) {
        alert(`Versículos salvos com sucesso!\n\nReferência: ${ref}`);
      } else {
        alert("Seleção removida dos salvos.");
      }
      setSelectedVerses({}); // Clear selection
      setIsSelectionMode(false); // Exit selection mode
    } catch (error) {
      console.error("Failed to save selection", error);
      alert("Erro ao salvar versículos.");
    }
  };

  const handleAnnotateSelected = async () => {
    if (Object.keys(selectedVerses).length === 0) {
      alert("Por favor, selecione pelo menos um versículo para anotar.");
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      alert("Você precisa estar logado para criar anotações. Vá ao Perfil para entrar.");
      return;
    }

    const ref = formatSelectedRef();
    const sortedKeys = Object.keys(selectedVerses).sort();
    const primaryKey = sortedKeys[0]; // Map note to the first verse key in the selection

    setActiveVerseNoteKey(primaryKey);
    setActiveVerseNoteRef(ref);
    setCurrentVerseNoteText(verseNotes[primaryKey]?.text || "");
    setVerseNoteModalOpen(true);

    // Clear selection and close selection mode
    setSelectedVerses({});
    setIsSelectionMode(false);
  };

  const handleSaveVerseNote = () => {
    if (activeVerseNoteKey) {
      setVerseNotes(prev => {
        const next = { ...prev };
        if (currentVerseNoteText.trim() === "") {
          delete next[activeVerseNoteKey];
        } else {
          next[activeVerseNoteKey] = { ref: activeVerseNoteRef, text: currentVerseNoteText };
        }
        localStorage.setItem('user_verse_notes', JSON.stringify(next));
        
        // Dispatch custom event to sync with JournalView
        window.dispatchEvent(new CustomEvent('verse-notes-updated'));
        return next;
      });
      setVerseNoteModalOpen(false);
    }
  };

  const handleHighlightSelected = () => {
    if (Object.keys(selectedVerses).length === 0) return;
    
    setHighlights(prev => {
      const next = { ...prev };
      const keys = Object.keys(selectedVerses);
      
      // If all selected verses are already highlighted, remove highlight. Otherwise, highlight them!
      const allHighlighted = keys.every(k => next[k]);
      
      keys.forEach(k => {
        if (allHighlighted) {
          delete next[k];
        } else {
          next[k] = true;
        }
      });
      
      localStorage.setItem('user_highlights', JSON.stringify(next));
      return next;
    });
    
    // Clear selection and close selection mode
    setSelectedVerses({});
    setIsSelectionMode(false);
  };

  // --- Actions ---
  const cycleFontSize = () => {
    setFontSize(prev => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'normal';
    });
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  const handleHeaderBookmark = async () => {
    if (!activeChapterKey) return;
    const chapter = renderedChapters.find(c => c.key === activeChapterKey);
    if (!chapter) return;

    try {
      const ref = `${chapter.bookName} ${chapter.chapterIndex + 1}`;
      const preview = chapter.verses[0].substring(0, 50) + "...";
      const newState = await toggleFavorite(ref, preview);
      setHeaderIsFavorite(newState);
      // Dispatch event to update child components
      window.dispatchEvent(new CustomEvent('favorite-updated', {
        detail: { ref, isFavorite: newState }
      }));
    } catch (error) {
      console.error("Header bookmark failed", error);
    }
  };


  // --- Initial Load ---
  useEffect(() => {
    const loadBible = async () => {
      try {
        logReading(); // Register activity for streak
        const data = await getBible();
        setBible(data);

        // Check for pending navigation (Deep Link)
        const pendingKey = localStorage.getItem('pending_nav_chapter');

        if (pendingKey && data.length > 0) {
          localStorage.removeItem('pending_nav_chapter');
          const [bookAbbrev, chapterIdxStr] = pendingKey.split('-');
          const chapterIdx = parseInt(chapterIdxStr, 10);

          const book = data.find(b => b.abbrev === bookAbbrev);
          if (book) {
            const initialChapter: RenderedChapter = {
              bookAbbrev: book.abbrev,
              bookName: book.name || book.abbrev,
              chapterIndex: chapterIdx,
              verses: book.chapters[chapterIdx],
              key: pendingKey
            };
            setRenderedChapters([initialChapter]);
            setActiveChapterKey(initialChapter.key);
            setCurrentTitle(`${initialChapter.bookName} ${initialChapter.chapterIndex + 1}:1`);
            return; // Skip default genesis load
          }
        }

        if (data.length > 0) {
          // Initialize with Genesis 1
          const gen = data[0];
          const initialChapter: RenderedChapter = {
            bookAbbrev: gen.abbrev,
            bookName: gen.name || gen.abbrev,
            chapterIndex: 0,
            verses: gen.chapters[0],
            key: `${gen.abbrev}-0`
          };
          setRenderedChapters([initialChapter]);
          setActiveChapterKey(initialChapter.key);
          setCurrentTitle(`${initialChapter.bookName} ${initialChapter.chapterIndex + 1}:1`);
        }
      } catch (error) {
        console.error("Failed to load Bible", error);
      }
    };
    loadBible();
  }, []);

  // --- Helpers ---
  const getBookByAbbrev = useCallback((abbrev: string) => bible.find(b => b.abbrev === abbrev), [bible]);

  const createChapterObject = (book: BibleBook, chapterIdx: number): RenderedChapter => ({
    bookAbbrev: book.abbrev,
    bookName: book.name || book.abbrev,
    chapterIndex: chapterIdx,
    verses: book.chapters[chapterIdx],
    key: `${book.abbrev}-${chapterIdx}`
  });

  // --- Infinite Scroll Logic ---
  const loadPreviousChapter = useCallback(() => {
    if (isFetchingRef.current || renderedChapters.length === 0) return;

    const first = renderedChapters[0];
    let prevBook = getBookByAbbrev(first.bookAbbrev);
    let prevIdx = first.chapterIndex - 1;

    if (prevIdx < 0) {
      // Go to previous book
      const currentBookIdx = bible.findIndex(b => b.abbrev === first.bookAbbrev);
      if (currentBookIdx > 0) {
        prevBook = bible[currentBookIdx - 1];
        prevIdx = prevBook.chapters.length - 1;
      } else {
        return; // Beginning of Bible
      }
    }

    if (prevBook) {
      isFetchingRef.current = true;
      const newChapter = createChapterObject(prevBook, prevIdx);

      // Preserve scroll position
      const container = containerRef.current;
      const oldHeight = container?.scrollHeight || 0;
      const oldTop = container?.scrollTop || 0;

      setRenderedChapters(prev => [newChapter, ...prev]);

      // Correction needs to happen after render.
      // We use requestAnimationFrame to approximate post-render adjustment.
      requestAnimationFrame(() => {
        if (container) {
          const newHeight = container.scrollHeight;
          container.scrollTop = oldTop + (newHeight - oldHeight);
          isFetchingRef.current = false;
        }
      });
    }
  }, [bible, renderedChapters, getBookByAbbrev]);

  const loadNextChapter = useCallback(() => {
    if (isFetchingRef.current || renderedChapters.length === 0) return;

    const last = renderedChapters[renderedChapters.length - 1];
    let nextBook = getBookByAbbrev(last.bookAbbrev);
    let nextIdx = last.chapterIndex + 1;

    if (nextBook && nextIdx >= nextBook.chapters.length) {
      // Go to next book
      const currentBookIdx = bible.findIndex(b => b.abbrev === last.bookAbbrev);
      if (currentBookIdx < bible.length - 1) {
        nextBook = bible[currentBookIdx + 1];
        nextIdx = 0;
      } else {
        return; // End of Bible
      }
    }

    if (nextBook) {
      isFetchingRef.current = true;
      const newChapter = createChapterObject(nextBook, nextIdx);
      setRenderedChapters(prev => [...prev, newChapter]);

      // Allow some time for render
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 100);
    }
  }, [bible, renderedChapters, getBookByAbbrev]);

  // Observers for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target === topSentinelRef.current) {
            loadPreviousChapter();
          } else if (entry.target === bottomSentinelRef.current) {
            loadNextChapter();
          }
        }
      });
    }, { root: containerRef.current, rootMargin: '200px' });

    if (topSentinelRef.current) observer.observe(topSentinelRef.current);
    if (bottomSentinelRef.current) observer.observe(bottomSentinelRef.current);

    return () => observer.disconnect();
  }, [loadPreviousChapter, loadNextChapter, renderedChapters.length]);

  // Observer for updating Title based on Visibility
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      // Sort by intersection ratio (most visible first) or top position
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length > 0) {
        const target = visible[0].target as HTMLElement;
        const book = target.getAttribute('data-book');
        const chapter = target.getAttribute('data-chapter');
        //const verse = target.getAttribute('data-verse');

        // Identify which chapter we are in
        const chapterKey = target.closest('section')?.getAttribute('data-key');
        if (chapterKey) {
          // Update active chapter key for header actions
          setActiveChapterKey(chapterKey);

          const c = renderedChapters.find(ch => ch.key === chapterKey);
          if (c) {
            // For now showing Chapter only in title to keep it clean, or could add verse if really needed
            setCurrentTitle(`${c.bookName} ${c.chapterIndex + 1}`);
          }
        }
      }
    }, {
      root: container,
      threshold: [0.1, 0.5, 1.0],
      rootMargin: "-10% 0px -60% 0px" // Adjusted focus area
    });

    // Need to observe new elements after render
    setTimeout(() => {
      const verseElements = container.querySelectorAll('article > p');
      verseElements.forEach(el => observer.observe(el));
    }, 100); // Small delay to ensure DOM is ready

    return () => observer.disconnect();
  }, [renderedChapters]); // Re-attach when chapters change


  // --- Navigation Handlers ---
  const openModal = () => {
    setModalStep('BOOKS');
    setSelectedBook(null);
    setSelectedChapterIdx(null);
    setModalOpen(true);
  };

  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
    setModalStep('CHAPTERS');
  };

  const handleChapterSelect = (idx: number) => {
    setSelectedChapterIdx(idx);
    setModalStep('VERSES');
  };

  const handleVerseSelect = (verseIdx: number) => {
    if (selectedBook && selectedChapterIdx !== null) {
      const newChapter = createChapterObject(selectedBook, selectedChapterIdx);
      setRenderedChapters([newChapter]);
      setModalOpen(false);
      setActiveChapterKey(newChapter.key);

      // Scroll to verse after render
      setTimeout(() => {
        const verseId = `verse-${newChapter.key}-${verseIdx + 1}`;
        const el = document.getElementById(verseId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          el.classList.add('bg-primary/20');
          setTimeout(() => el.classList.remove('bg-primary/20'), 2000);
        }
      }, 100);
    }
  };

  // --- Note Handling ---
  const handleOpenNoteModal = async (chapter: RenderedChapter) => {
    setActiveNoteChapter(chapter);
    // Load existing note from Cloud (Supabase)
    setCurrentNote("Carregando..."); // Optimistic UI
    try {
      const savedNote = await getNote(chapter.bookAbbrev, chapter.chapterIndex);
      setCurrentNote(savedNote);
    } catch (error) {
      console.error("Failed to load note", error);
      setCurrentNote("");
    }
    setNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (activeNoteChapter) {
      try {
        await saveNote(activeNoteChapter.bookAbbrev, activeNoteChapter.chapterIndex, currentNote);
        setNoteModalOpen(false);
      } catch (error) {
        console.error("Failed to save note", error);
        alert("Erro ao salvar anotação.");
      }
    }
  };

  // --- Modal Content ---
  const renderModalContent = () => {
    if (modalStep === 'BOOKS') {
      return (
        <div className="flex-1 overflow-y-auto p-4 pb-16 custom-scrollbar">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3">
            {bible.map(book => (
              <button
                key={book.abbrev}
                onClick={() => handleBookSelect(book)}
                className="aspect-square flex items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-primary/10 hover:text-primary transition-colors border border-gray-100 dark:border-white/10 shadow-sm p-2"
              >
                <span className="font-bold text-xs sm:text-sm text-[#1c1a0d] dark:text-[#fcfbf8] text-center break-words">{formatAbbrev(book.abbrev)}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (modalStep === 'CHAPTERS' && selectedBook) {
      return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-2 p-4 pb-2 shrink-0">
            <button onClick={() => setModalStep('BOOKS')} className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"><span className="material-symbols-outlined text-[#1c1a0d] dark:text-[#fcfbf8]">arrow_back</span></button>
            <h3 className="font-bold text-lg text-[#1c1a0d] dark:text-[#fcfbf8]">{selectedBook.name}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-16 custom-scrollbar">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-3">
              {selectedBook.chapters.map((verses, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChapterSelect(idx)}
                  className="aspect-square flex flex-col items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-primary/10 hover:text-primary transition-colors border border-gray-100 dark:border-white/10 relative shadow-sm"
                >
                  <span className="font-bold text-xl text-[#1c1a0d] dark:text-[#fcfbf8]">{idx + 1}</span>
                  <span className="text-[10px] text-gray-400 absolute bottom-1 right-1">{verses.length}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    if (modalStep === 'VERSES' && selectedBook && selectedChapterIdx !== null) {
      const verses = selectedBook.chapters[selectedChapterIdx];
      return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-2 p-4 pb-2 shrink-0">
            <button onClick={() => setModalStep('CHAPTERS')} className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"><span className="material-symbols-outlined text-[#1c1a0d] dark:text-[#fcfbf8]">arrow_back</span></button>
            <h3 className="font-bold text-lg text-[#1c1a0d] dark:text-[#fcfbf8]">{selectedBook.name} {selectedChapterIdx + 1}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-16 custom-scrollbar">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-3">
              {verses.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleVerseSelect(idx)}
                  className="aspect-square flex items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-primary/10 hover:text-primary transition-colors border border-gray-100 dark:border-white/10 shadow-sm"
                >
                  <span className="font-bold text-xl text-[#1c1a0d] dark:text-[#fcfbf8]">{idx + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark relative">
      {/* Top Navigation Bar / Selection Bar Overlay */}
      <header className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        isSelectionMode 
          ? 'bg-primary text-[#1c1a0d] border-primary/20 shadow-lg' 
          : 'bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-gray-100 dark:border-white/10'
      }`}>
        <div className="flex items-center justify-between px-4 h-16 max-w-2xl mx-auto w-full">
          {isSelectionMode ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedVerses({});
                    setIsSelectionMode(false);
                  }}
                  className="p-1 hover:bg-black/10 rounded-full transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-2xl font-bold">close</span>
                </button>
                <span className="font-bold text-sm font-sans shrink-0">
                  {Object.keys(selectedVerses).length} sel.
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={handleAnnotateSelected}
                  disabled={Object.keys(selectedVerses).length === 0}
                  className={`flex items-center gap-1 bg-black/5 hover:bg-black/10 text-black px-2.5 py-1.5 rounded-full font-bold text-[10px] sm:text-xs shadow-sm transition-all active:scale-95 shrink-0 ${
                    Object.keys(selectedVerses).length === 0 ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-xs sm:text-sm font-bold">edit_note</span>
                  Anotar
                </button>

                <button
                  onClick={handleHighlightSelected}
                  disabled={Object.keys(selectedVerses).length === 0}
                  className={`flex items-center gap-1 bg-black/5 hover:bg-black/10 text-black px-2.5 py-1.5 rounded-full font-bold text-[10px] sm:text-xs shadow-sm transition-all active:scale-95 shrink-0 ${
                    Object.keys(selectedVerses).length === 0 ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-xs sm:text-sm font-bold">
                    {isAllHighlighted ? 'ink_eraser' : 'border_color'}
                  </span>
                  {isAllHighlighted ? 'Apagar' : 'Destacar'}
                </button>

                <button
                  onClick={handleSaveSelected}
                  disabled={Object.keys(selectedVerses).length === 0}
                  className={`flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-full font-bold text-[10px] sm:text-xs shadow-md transition-all active:scale-95 shrink-0 ${
                    Object.keys(selectedVerses).length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-black/80'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs sm:text-sm">bookmark</span>
                  Salvar
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={openModal}
                className="flex items-center gap-1 text-[#1c1a0d] dark:text-[#fcfbf8] font-bold text-lg hover:opacity-70 transition-opacity"
              >
                {currentTitle}
                <span className="material-symbols-outlined text-primary text-2xl">expand_more</span>
              </button>

              <div className="flex items-center gap-4">
                <button onClick={toggleTheme} className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors flex items-center justify-center" title={isDarkMode ? "Modo Claro" : "Modo Escuro"}>
                  <span className="material-symbols-outlined">
                    {isDarkMode ? 'light_mode' : 'dark_mode'}
                  </span>
                </button>
                <button onClick={cycleFontSize} className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined">text_fields</span>
                  <span className="text-[10px] ml-1 font-bold">{fontSize === 'normal' ? 'A' : fontSize === 'large' ? 'A+' : 'A++'}</span>
                </button>
                <button onClick={handleHeaderBookmark} className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors">
                  <span className={`material-symbols-outlined ${headerIsFavorite ? 'filled-icon' : ''}`}>
                    {headerIsFavorite ? 'bookmark' : 'bookmark_border'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Navigation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end sm:justify-center items-center backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-2xl h-[80vh] sm:h-[70vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <span className="font-bold text-lg text-[#1c1a0d] dark:text-[#fcfbf8]">
                {modalStep === 'BOOKS' ? 'Selecionar Livro' :
                  modalStep === 'CHAPTERS' ? 'Selecionar Capítulo' : 'Selecionar Versículo'}
              </span>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
                <span className="material-symbols-outlined text-[#1c1a0d] dark:text-[#fcfbf8]">close</span>
              </button>
            </div>
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}

      {/* Custom Chapter Swap Confirmation Modal */}
      {swapConfirmOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex flex-col justify-end sm:justify-center items-center backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-3xl shadow-2xl p-6 flex flex-col items-center text-center animate-in slide-in-from-bottom duration-300">
            <div className="bg-primary/10 p-4 rounded-full mb-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-4xl">warning</span>
            </div>
            
            <h3 className="font-serif text-xl font-bold text-[#1c1a0d] dark:text-[#fcfbf8] mb-3">
              Mudar de Capítulo?
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Você só pode selecionar versículos do mesmo capítulo. Deseja descartar a seleção anterior e iniciar uma nova neste capítulo?
            </p>
            
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => {
                  setSwapConfirmOpen(false);
                  setPendingSwapData(null);
                }}
                className="flex-1 py-3 px-4 rounded-full font-bold text-sm border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 active:scale-95 transition-all"
              >
                Cancelar
              </button>
              
              <button
                onClick={() => {
                  if (pendingSwapData) {
                    setSelectedVerses({ [pendingSwapData.key]: pendingSwapData.info });
                  }
                  setSwapConfirmOpen(false);
                  setPendingSwapData(null);
                }}
                className="flex-1 py-3 px-4 rounded-full font-bold text-sm bg-primary text-[#1c1a0d] hover:opacity-90 active:scale-95 transition-all shadow-md"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end sm:justify-center items-center backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-2xl h-[60vh] sm:h-[400px] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <span className="font-bold text-lg text-[#1c1a0d] dark:text-[#fcfbf8] flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                Anotação: {activeNoteChapter?.bookName} {activeNoteChapter?.chapterIndex !== undefined ? activeNoteChapter.chapterIndex + 1 : ''}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={handleSaveNote} className="text-primary font-bold px-3 py-1 rounded-full hover:bg-primary/10 transition-colors">
                  Salvar
                </button>
                <button onClick={() => setNoteModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
                  <span className="material-symbols-outlined text-[#1c1a0d] dark:text-[#fcfbf8]">close</span>
                </button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <textarea
                className="w-full h-full resize-none bg-transparent border-none outline-none text-lg text-[#1c1a0d] dark:text-[#e0e0e0] placeholder-gray-400"
                placeholder="Escreva suas reflexões sobre este capítulo..."
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Independent Verse Note Modal */}
      {verseNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end sm:justify-center items-center backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/10">
              <span className="font-bold text-base text-[#1c1a0d] dark:text-[#fcfbf8] flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                Anotação: {activeVerseNoteRef}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSaveVerseNote}
                  className="bg-primary text-[#1c1a0d] font-bold px-4 py-1.5 rounded-full hover:opacity-90 transition-all text-xs shadow-sm active:scale-95"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setVerseNoteModalOpen(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"
                >
                  <span className="material-symbols-outlined text-[#1c1a0d] dark:text-[#fcfbf8]">close</span>
                </button>
              </div>
            </div>
            <div className="p-5 h-64">
              <textarea
                className="w-full h-full resize-none bg-transparent border-none outline-none text-base text-[#1c1a0d] dark:text-[#e0e0e0] placeholder-gray-400 font-sans leading-relaxed"
                placeholder="Escreva sua anotação pessoal independente para este versículo..."
                value={currentVerseNoteText}
                onChange={(e) => setCurrentVerseNoteText(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Infinite Scroll */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto relative no-scrollbar"
      >
        <div ref={topSentinelRef} className="h-4 w-full" />

        <div className="max-w-2xl mx-auto px-6 py-6 space-y-12">
          {renderedChapters.map((chapter) => (
            <ChapterSection 
              key={chapter.key} 
              chapter={chapter} 
              onAnnotate={handleOpenNoteModal} 
              fontSize={fontSize}
              selectedVerses={selectedVerses}
              onToggleSelection={handleToggleSelection}
              isSelectionMode={isSelectionMode}
              highlights={highlights}
              verseNotes={verseNotes}
            />
          ))}
        </div>

        <div ref={bottomSentinelRef} className="h-20 w-full flex items-center justify-center">
          {isFetchingRef.current && <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
        </div>
      </div>
    </div>
  );
};

export default ReadingView;
