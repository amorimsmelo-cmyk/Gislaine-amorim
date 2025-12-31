
import React from 'react';

interface SidebarProps {
  activeTab: 'chat' | 'dashboard';
  setActiveTab: (tab: 'chat' | 'dashboard') => void;
  salonName: string;
  whatsappConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, salonName, whatsappConnected }) => {
  return (
    <div className="w-16 md:w-64 bg-[#111b21] text-gray-400 flex flex-col h-full shrink-0">
      <div className="p-4 flex items-center gap-3 text-white border-b border-gray-700">
        <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center font-bold text-xl">
          C
        </div>
        <span className="hidden md:block font-bold truncate">{salonName}</span>
      </div>

      <nav className="flex-1 mt-4">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`w-full flex items-center gap-4 p-4 hover:bg-[#202c33] transition-colors ${activeTab === 'chat' ? 'text-[#00a884] bg-[#202c33]' : ''}`}
        >
          <div className="relative">
            <i className="fa-brands fa-whatsapp text-2xl"></i>
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#111b21] ${whatsappConnected ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
          </div>
          <span className="hidden md:block font-medium">Chat Clara</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-4 p-4 hover:bg-[#202c33] transition-colors ${activeTab === 'dashboard' ? 'text-[#00a884] bg-[#202c33]' : ''}`}
        >
          <i className="fa-solid fa-gauge-high text-xl"></i>
          <span className="hidden md:block font-medium">Painel & Conexão</span>
        </button>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className={`hidden md:block text-[10px] uppercase mb-2 font-bold ${whatsappConnected ? 'text-emerald-500' : 'text-orange-500'}`}>
          {whatsappConnected ? 'WhatsApp Ativo' : 'WhatsApp Offline'}
        </div>
        <button className="w-full flex items-center gap-4 p-2 hover:bg-[#202c33] transition-colors rounded">
          <i className="fa-solid fa-gear"></i>
          <span className="hidden md:block">Ajustes</span>
        </button>
      </div>
    </div>
  );
};
