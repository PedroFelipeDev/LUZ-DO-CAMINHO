import React from 'react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const getTabClass = (tab: Tab) => {
    return activeTab === tab
      ? "text-primary"
      : "text-gray-400 dark:text-gray-500 hover:text-primary transition-colors";
  };

  const getIconClass = (tab: Tab) => {
    return `material-symbols-outlined text-[24px] ${activeTab === tab ? "filled-icon font-bold" : ""}`;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#1a180d]/95 backdrop-blur-lg border-t border-gray-100 dark:border-white/10 pb-6 pt-2 z-50">
      <div className="flex items-center justify-between max-w-md mx-auto px-6">
        <button
          onClick={() => setActiveTab(Tab.READING)}
          className={`flex flex-col items-center gap-1 ${getTabClass(Tab.READING)}`}
        >
          <span className={getIconClass(Tab.READING)}>menu_book</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Leitura</span>
        </button>

        <button
          onClick={() => setActiveTab(Tab.CHAT)}
          className={`flex flex-col items-center gap-1 ${getTabClass(Tab.CHAT)}`}
        >
          <span className={getIconClass(Tab.CHAT)}>chat_bubble</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Chat</span>
        </button>

        <button
          onClick={() => setActiveTab(Tab.JOURNAL)}
          className={`flex flex-col items-center gap-1 ${getTabClass(Tab.JOURNAL)}`}
        >
          {/* Note: In screenshots Journal uses 'edit_note' or 'auto_stories'. Using edit_note as per latest wireframe */}
          <span className={getIconClass(Tab.JOURNAL)}>edit_note</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Diário</span>
        </button>

        <button
          onClick={() => setActiveTab(Tab.PROFILE)}
          className={`flex flex-col items-center gap-1 ${getTabClass(Tab.PROFILE)}`}
        >
          <span className={getIconClass(Tab.PROFILE)}>person</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Perfil</span>
        </button>

        {/* Secret Admin Button (Double click profile maybe? For now explicit button for dev) */}
        <button
          onClick={() => setActiveTab(Tab.MISSION_CONTROL)}
          className={`flex flex-col items-center gap-1 ${activeTab === Tab.MISSION_CONTROL ? "text-green-500" : "text-gray-400/20 hover:text-green-500/50"}`}
        >
          <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
          <span className="text-[8px] font-bold uppercase tracking-wider">Admin</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
