
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { Dashboard } from './components/Dashboard';
import { Message, SalonState, Appointment, Client } from './types';
import { INITIAL_CLIENTS, INITIAL_APPOINTMENTS } from './constants';
import { getClaraResponse, parseAppointmentFromText } from './services/gemini';

const App: React.FC = () => {
  const [salon, setSalon] = useState<SalonState>({
    id: 'salon_123',
    name: 'Espaço Beleza Real',
    clients: INITIAL_CLIENTS,
    appointments: INITIAL_APPOINTMENTS
  });

  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAppointment, setPendingAppointment] = useState<Partial<Appointment> | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      role: 'assistant',
      content: 'Olá! Sou a Clara. 👋 Vi que você ainda não conectou seu WhatsApp. Para eu poder enviar mensagens automáticas de retorno para suas clientes, preciso que você conecte seu aparelho.\n\nQuer que eu te ensine como fazer?',
      timestamp: new Date()
    }
  ]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const lowerText = text.toLowerCase();
      
      // Detecção de dúvida sobre conexão
      if (lowerText.includes('como') && (lowerText.includes('conectar') || lowerText.includes('fazer') || lowerText.includes('sei'))) {
        setMessages(prev => [...prev, {
          id: 'resp_' + Date.now(),
          role: 'assistant',
          content: 'É bem simples! Siga estes passos:\n\n1️⃣ No menu à esquerda, clique em **"Painel & Conexão"**.\n2️⃣ Clique no botão verde **"GERAR NOVA CONEXÃO"**.\n3️⃣ No seu celular, abra o WhatsApp > Configurações > Aparelhos Conectados.\n4️⃣ Toque em "Conectar um Aparelho" e aponte a câmera para o código que aparecerá aqui na tela.\n\nEstou te esperando na aba de conexão!',
          timestamp: new Date()
        }]);
        setIsLoading(false);
        return;
      }

      // Atalho para conexão
      if (lowerText.includes('conectar') || lowerText.includes('qr code') || lowerText.includes('vincular')) {
        setActiveTab('dashboard');
        setMessages(prev => [...prev, {
          id: 'resp_' + Date.now(),
          role: 'assistant',
          content: 'Certo! Te trouxe para a aba de conexão. Clique no botão abaixo para gerar o QR Code.',
          timestamp: new Date()
        }]);
        setIsLoading(false);
        return;
      }

      if (pendingAppointment) {
        const isPositive = lowerText.includes('sim') || lowerText.includes('confirmo') || lowerText.includes('pode') || lowerText.includes('ok');
        if (isPositive) {
          const newAppointment: Appointment = {
            id: 'a' + Date.now(),
            clientId: 'temp_' + Date.now(),
            clientName: pendingAppointment.clientName || 'Cliente Novo',
            phone: pendingAppointment.phone || '',
            date: pendingAppointment.date || new Date().toISOString(),
            service: pendingAppointment.service || 'Serviço',
            value: pendingAppointment.value || 0,
            month: new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date()),
            confirmed: true
          };

          setSalon(prev => ({
            ...prev,
            appointments: [...prev.appointments, newAppointment]
          }));

          setMessages(prev => [...prev, {
            id: 'resp_' + Date.now(),
            role: 'assistant',
            content: '✅ Atendimento registrado! Agora, se você conectar o WhatsApp, eu poderei avisar a cliente automaticamente no dia da manutenção. Vamos conectar?',
            timestamp: new Date()
          }]);
          
          setPendingAppointment(null);
          setIsLoading(false);
          return;
        }
      }

      if (lowerText.includes('você envia') || lowerText.includes('pode enviar') || lowerText.includes('envia você')) {
        if (!whatsappConnected) {
          setMessages(prev => [...prev, {
            id: 'resp_' + Date.now(),
            role: 'assistant',
            content: 'Eu adoraria! Mas ainda não estamos conectados. Clique em **"Painel & Conexão"** para gerar seu código de acesso.',
            timestamp: new Date()
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: 'resp_' + Date.now(),
            role: 'assistant',
            content: 'Com prazer! Enviando mensagem agora... ✅ Prontinho!',
            timestamp: new Date()
          }]);
        }
        setIsLoading(false);
        return;
      }

      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const response = await getClaraResponse(text, history, salon);
      
      const assistantMsg: Message = {
        id: 'resp_' + Date.now(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      const extracted = parseAppointmentFromText(response);
      if (extracted) {
        setPendingAppointment(extracted);
      }

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: 'Ops, tive um erro. Pode repetir?',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: `📎 Arquivo: ${file.name}`, timestamp: new Date() }]);
      try {
        const lines = content.split('\n').filter(line => line.trim() !== '');
        const newClients: Client[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim());
          if (parts.length >= 2) {
            // Fix: Added missing 'birthday' and 'memberSince' properties to comply with the Client interface
            newClients.push({
              id: 'imp_' + Math.random().toString(36).substr(2, 9),
              name: parts[0],
              phone: parts[1],
              category: 'Cabelo',
              lastVisit: new Date().toISOString().split('T')[0],
              birthday: '1900-01-01', // Default placeholder
              memberSince: new Date().toISOString().split('T')[0], // Default to import date
              servicesCount: 0,
              totalSpent: 0
            });
          }
        }
        setSalon(prev => ({ ...prev, clients: [...prev.clients, ...newClients] }));
        setMessages(prev => [...prev, { id: 'resp_' + Date.now(), role: 'assistant', content: `📊 Importei ${newClients.length} clientes! Vamos conectar seu WhatsApp para que eu possa dar as boas-vindas a eles?`, timestamp: new Date() }]);
      } catch (err) {
        setMessages(prev => [...prev, { id: 'err_' + Date.now(), role: 'assistant', content: 'Erro ao ler arquivo.', timestamp: new Date() }]);
      } finally { setIsLoading(false); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen w-full bg-[#f0f2f5] overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} salonName={salon.name} whatsappConnected={whatsappConnected} />
      <main className="flex-1 flex flex-col relative">
        {activeTab === 'chat' ? (
          <ChatWindow messages={messages} onSend={handleSendMessage} onFileUpload={handleFileUpload} isLoading={isLoading} />
        ) : (
          <Dashboard salon={salon} whatsappConnected={whatsappConnected} setWhatsappConnected={setWhatsappConnected} />
        )}
      </main>
    </div>
  );
};

export default App;
