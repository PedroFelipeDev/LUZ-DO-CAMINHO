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

  const renderContent = () => {
    switch (activeTab) {
      case Tab.READING:
        return <ReadingView />;
      case Tab.CHAT:
        return <ChatView />;
      case Tab.JOURNAL:
        return <JournalView />;
      case Tab.PROFILE:
        return <ProfileView />;
      case Tab.MISSION_CONTROL:
        return <MissionControl />;
      default:
        return <ReadingView />;
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden max-w-[480px] mx-auto bg-background-light dark:bg-background-dark border-x border-gray-100 dark:border-gray-800 shadow-xl">
      <div className="h-full pb-[80px]"> {/* Padding for bottom nav */}
        {renderContent()}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
