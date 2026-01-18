import React from 'react';

const MissionControl: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-white p-6 font-mono overflow-y-auto">
            <header className="mb-8 border-b border-gray-800 pb-4">
                <h1 className="text-2xl font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined">rocket_launch</span>
                    Mission Control
                </h1>
                <p className="text-xs text-gray-500 mt-1">SYSTEM MONITORING v1.0.0</p>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-900 p-4 rounded border border-gray-800">
                    <h3 className="text-xs text-gray-400 uppercase mb-2">Gemini API Status</h3>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-sm font-bold">OPERATIONAL</span>
                    </div>
                </div>
                <div className="bg-gray-900 p-4 rounded border border-gray-800">
                    <h3 className="text-xs text-gray-400 uppercase mb-2">Firebase Status</h3>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-sm font-bold">CONNECTED</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-sm font-bold text-gray-400 uppercase border-l-2 border-green-500 pl-2">System Logs</h2>
                <div className="bg-gray-900/50 p-4 rounded text-xs font-mono h-48 overflow-y-auto border border-gray-800">
                    <p className="text-green-400">[21:42:01] System initialized</p>
                    <p className="text-gray-400">[21:42:02] Analytics module loaded</p>
                    <p className="text-gray-400">[21:42:02] Performance monitoring active</p>
                    <p className="text-green-400">[21:42:05] Connected to Gemini Pro 1.5</p>
                    <p className="text-blue-400">[21:45:12] User request: Reading View</p>
                </div>
            </div>
        </div>
    );
};

export default MissionControl;
