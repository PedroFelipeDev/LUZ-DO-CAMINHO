import React, { useState } from 'react';
import ReadingView from './components/ReadingView';
import ChatView from './components/ChatView';
import JournalView from './components/JournalView';
import ProfileView from './components/ProfileView';
import MissionControl from './components/MissionControl';
import BottomNav from './components/BottomNav';
import { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.READING);
  const [hideBottomNav, setHideBottomNav] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.READING:
        return <ReadingView onModalToggle={setHideBottomNav} />;
      case Tab.CHAT:
        return <ChatView />;
      case Tab.JOURNAL:
        return <JournalView onNavigate={setActiveTab} />;
      case Tab.PROFILE:
        return <ProfileView />;
      case Tab.MISSION_CONTROL:
        return <MissionControl />;
      default:
        return <ReadingView onModalToggle={setHideBottomNav} />;
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden max-w-[480px] mx-auto bg-background-light dark:bg-background-dark border-x border-gray-100 dark:border-gray-800 shadow-xl">
      <div className={`h-full transition-all duration-300 ${hideBottomNav ? 'pb-0' : 'pb-[80px]'}`}>
        {renderContent()}
      </div>
      {!hideBottomNav && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
};

export default App;
