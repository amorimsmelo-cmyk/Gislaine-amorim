
import React, { useMemo, useState } from 'react';
import { SalonState, Client, Appointment } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  salon: SalonState;
  whatsappConnected: boolean;
  setWhatsappConnected: (val: boolean) => void;
}

type SubTab = 'resumo' | 'visitas' | 'estrategias' | 'relatorios' | 'conexao';
type StrategyCategory = 'posvenda' | 'ativas' | 'inativas' | 'prospeccao';
type ClientStatus = 'todos' | 'ativos' | 'inativos';

export const Dashboard: React.FC<DashboardProps> = ({ salon, whatsappConnected, setWhatsappConnected }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('resumo');
  const [activeStrategy, setActiveStrategy] = useState<StrategyCategory>('posvenda');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>(['[SISTEMA] Pronto para conexão.']);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const [filterMonth, setFilterMonth] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<ClientStatus>('todos');

  const ALL_MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-3), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // --- Lógica de Dados ---
  const monthsData = useMemo(() => {
    return ALL_MONTHS.map((m, index) => {
      const appointments = salon.appointments.filter(a => a.month === m);
      const birthdays = salon.clients.filter(c => {
        // Formato YYYY-MM-DD, pegamos o mês (index 1)
        const bParts = c.birthday.split('-');
        return parseInt(bParts[1]) === index + 1;
      });
      return { 
        name: m, 
        total: appointments.length, 
        clients: Array.from(new Set(appointments.map(a => a.clientName))),
        birthdays: birthdays,
        isCurrentMonth: new Date().getMonth() === index
      };
    });
  }, [salon.appointments, salon.clients]);

  const calculateStats = (client: Client) => {
    const now = new Date();
    const lastVisit = new Date(client.lastVisit + "T00:00:00");
    const memberSince = new Date(client.memberSince + "T00:00:00");
    
    const diffDays = Math.ceil(Math.abs(now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
    const diffYears = now.getFullYear() - memberSince.getFullYear();
    const diffMonths = (now.getMonth() + 12 * now.getFullYear()) - (memberSince.getMonth() + 12 * memberSince.getFullYear());
    
    let timeLabel = `${diffMonths} meses`;
    if (diffMonths >= 12) {
      timeLabel = `${diffYears} ano(s)`;
    }

    return { diffDays, timeLabel };
  };

  const automaticReminders = useMemo(() => {
    return salon.clients.map(c => {
      const { diffDays } = calculateStats(c);
      let reminderType: string | null = null;
      let priority: 'baixa' | 'media' | 'alta' = 'baixa';

      if (diffDays === 30) { reminderType = "Meta 30 dias"; priority = "alta"; }
      else if (diffDays === 45) { reminderType = "Meta 45 dias"; priority = "alta"; }
      else if (diffDays === 60) { reminderType = "Crítico: 60 dias"; priority = "alta"; }
      else if (diffDays > 30 && diffDays % 15 === 0) { reminderType = "Recorrência Inativa"; priority = "media"; }

      return { ...c, diffDays, reminderType, priority };
    }).filter(c => c.reminderType !== null).sort((a, b) => b.diffDays - a.diffDays);
  }, [salon.clients]);

  const filteredClients = useMemo(() => {
    let list = [...salon.clients];
    if (filterStatus !== 'todos') {
      const now = new Date();
      list = list.filter(c => {
        const diff = Math.ceil(Math.abs(now.getTime() - new Date(c.lastVisit + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));
        return filterStatus === 'inativos' ? diff > 30 : diff <= 30;
      });
    }
    if (filterMonth !== 'todos') {
      const names = new Set(salon.appointments.filter(a => a.month === filterMonth).map(a => a.clientName));
      list = list.filter(c => names.has(c.name));
    }
    return list;
  }, [salon.clients, salon.appointments, filterMonth, filterStatus]);

  const clientAppointments = useMemo(() => {
    if (!selectedClient) return [];
    return salon.appointments.filter(a => a.clientId === selectedClient.id || a.clientName === selectedClient.name);
  }, [selectedClient, salon.appointments]);

  const categorizedClients = useMemo(() => {
    return salon.clients.map(c => {
      const { diffDays } = calculateStats(c);
      let cat: StrategyCategory = 'prospeccao';
      let msg = "";

      if (c.servicesCount === 0 || c.totalSpent === 0) {
        cat = 'prospeccao';
        msg = `Olá ${c.name}, tudo bem? Sou da ${salon.name}. Vimos que você ainda não conhece nossos serviços! Que tal um bônus de 10% na primeira visita?`;
      } else if (diffDays <= 7) {
        cat = 'posvenda';
        msg = `Oi ${c.name}! Faz alguns dias que você esteve aqui. Deu tudo certo com seu serviço? Sua opinião é muito importante!`;
      } else if (diffDays <= 30) {
        cat = 'ativas';
        msg = `Olá ${c.name}! Notamos que está quase na hora da sua manutenção. Vamos garantir seu horário para esta semana?`;
      } else {
        cat = 'inativas';
        msg = `Oi ${c.name}, estamos com saudades! Notamos que faz mais de 30 dias que não nos visita. Temos uma condição especial para sua volta!`;
      }

      return { ...c, diffDays, strategyMsg: msg, cat };
    }).filter(c => c.cat === activeStrategy);
  }, [salon.clients, activeStrategy, salon.name]);

  const handleClientClick = (clientName: string) => {
    const client = salon.clients.find(c => c.name === clientName);
    if (client) setSelectedClient(client);
  };

  const startConnect = () => {
    setIsLoading(true);
    addLog('Iniciando handshake seguro...');
    setTimeout(() => {
      addLog('QR Code gerado. Aguardando leitura do dispositivo...');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8fafc]">
      {/* Modal Detalhes Cliente */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#00a884] p-8 text-white relative shrink-0">
              <button 
                onClick={() => setSelectedClient(null)}
                className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition-all"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold uppercase">
                  {selectedClient.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-black">{selectedClient.name}</h2>
                  <p className="opacity-80 text-sm flex items-center gap-2">
                    {selectedClient.phone} 
                    <span className="inline-block w-1 h-1 bg-white/40 rounded-full"></span>
                    <i className="fa-solid fa-cake-candles text-[10px]"></i> {selectedClient.birthday.split('-')[2]}/{selectedClient.birthday.split('-')[1]}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Gasto Total</div>
                  <div className="text-xl font-bold text-[#00a884]">R$ {selectedClient.totalSpent}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Visitas</div>
                  <div className="text-xl font-bold text-slate-800">{selectedClient.servicesCount}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Cadastro</div>
                  <div className="text-sm font-bold text-slate-800">{calculateStats(selectedClient).timeLabel}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Última Visita</div>
                  <div className="text-sm font-bold text-rose-500">{calculateStats(selectedClient).diffDays} dias</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-clock-rotate-left text-[#00a884]"></i> Histórico de Serviços
                </h3>
                <div className="space-y-2">
                  {clientAppointments.length > 0 ? clientAppointments.map((ap, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-white border rounded-xl shadow-sm">
                      <div>
                        <div className="font-bold text-slate-700 text-sm">{ap.service}</div>
                        <div className="text-[10px] text-slate-400">{new Date(ap.date).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <div className="font-bold text-[#00a884]">R$ {ap.value}</div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-slate-400 text-sm italic border-2 border-dashed rounded-2xl">
                      Nenhum atendimento registrado no histórico.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t flex gap-3 shrink-0">
              <button 
                onClick={() => window.open(`https://wa.me/${selectedClient.phone}`)}
                className="flex-1 bg-[#00a884] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-[#008f6f] transition-all"
              >
                <i className="fa-brands fa-whatsapp text-lg"></i> CONTATO DIRETO
              </button>
              <button 
                onClick={() => setSelectedClient(null)}
                className="px-6 border py-4 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-100"
              >
                VOLTAR
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">SaaS Conecta Clientes</h1>
          <p className="text-sm text-slate-500">Gestão Estratégica {salon.name}</p>
        </div>
        
        <div className="flex flex-wrap bg-slate-200/50 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'resumo', label: 'Dashboard', icon: 'fa-chart-pie' },
            { id: 'visitas', label: 'Mensal', icon: 'fa-calendar-days' },
            { id: 'estrategias', label: 'Estratégias', icon: 'fa-bullseye' },
            { id: 'relatorios', label: 'Relatórios', icon: 'fa-file-lines' },
            { id: 'conexao', label: 'Conexão', icon: 'fa-link' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeSubTab === tab.id ? 'bg-white text-[#00a884] shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
            >
              <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'resumo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-white border rounded-2xl shadow-sm border-l-4 border-l-[#00a884]">
              <div className="text-slate-400 text-[10px] font-black uppercase mb-1">Ações do Dia</div>
              <div className="text-xl font-bold text-[#00a884] flex items-center gap-2">
                <i className="fa-solid fa-bell"></i> {automaticReminders.length} Lembretes
              </div>
            </div>
            <div className="p-6 bg-white border rounded-2xl shadow-sm border-l-4 border-l-blue-500">
              <div className="text-slate-400 text-[10px] font-black uppercase mb-1">Total Clientes</div>
              <div className="text-xl font-bold text-slate-800">{salon.clients.length}</div>
            </div>
            <div className="p-6 bg-white border rounded-2xl shadow-sm border-l-4 border-l-purple-500">
              <div className="text-slate-400 text-[10px] font-black uppercase mb-1">Atendimentos</div>
              <div className="text-xl font-bold text-slate-800">{salon.appointments.length}</div>
            </div>
            <div className="p-6 bg-white border rounded-2xl shadow-sm border-l-4 border-l-amber-500">
              <div className="text-slate-400 text-[10px] font-black uppercase mb-1">Aniversariantes</div>
              <div className="text-xl font-bold text-slate-800">
                {salon.clients.filter(c => {
                  const bMonth = parseInt(c.birthday.split('-')[1]);
                  return bMonth === new Date().getMonth() + 1;
                }).length}
              </div>
            </div>
          </div>

          {automaticReminders.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <h3 className="text-amber-800 font-black text-sm uppercase mb-4 flex items-center gap-2">
                <i className="fa-solid fa-clock"></i> Lembretes de Retorno Prioritários (Inativas)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {automaticReminders.slice(0, 3).map(c => (
                  <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                      <div className="text-[10px] text-amber-600 font-black">{c.reminderType}</div>
                    </div>
                    <button 
                      onClick={() => { setActiveSubTab('estrategias'); setActiveStrategy('inativas'); }}
                      className="text-[#00a884] hover:scale-110 transition-transform"
                    >
                      <i className="fa-solid fa-circle-arrow-right text-xl"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><i className="fa-solid fa-chart-line text-[#00a884]"></i> Frequência de Atendimentos</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthsData.filter(m => m.total > 0 || m.birthdays.length > 0)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="total" fill="#00a884" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'visitas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {monthsData.map(m => (
            <div 
              key={m.name} 
              className={`bg-white border rounded-2xl shadow-sm h-96 flex flex-col overflow-hidden transition-all hover:shadow-lg ${m.isCurrentMonth ? 'ring-2 ring-[#00a884]' : ''}`}
            >
              <div className={`p-4 border-b ${m.isCurrentMonth ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-black uppercase text-sm ${m.isCurrentMonth ? 'text-emerald-700' : 'text-slate-800'}`}>{m.name}</span>
                  <span className="text-[10px] bg-[#00a884] text-white px-2 py-0.5 rounded-full font-bold shadow-sm">{m.total} visitas</span>
                </div>
                {m.birthdays.length > 0 && (
                  <div className={`text-[10px] font-black flex items-center gap-1 ${m.isCurrentMonth ? 'text-amber-600 animate-pulse' : 'text-amber-500'}`}>
                    <i className="fa-solid fa-cake-candles"></i> {m.birthdays.length} Aniversariantes
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Seção de Aniversariantes com Destaque */}
                {m.birthdays.length > 0 && (
                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    <div className="text-[10px] font-black text-amber-600 uppercase mb-3 flex items-center justify-between">
                      Destaque Aniversários
                      <i className="fa-solid fa-gift"></i>
                    </div>
                    <div className="space-y-1.5">
                      {m.birthdays.map((c) => (
                        <button 
                          key={c.id} 
                          onClick={() => setSelectedClient(c)}
                          className="w-full text-left text-xs text-amber-800 p-2.5 bg-white rounded-lg border border-amber-100 hover:border-amber-400 hover:shadow-sm transition-all font-black flex items-center justify-between group"
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold group-hover:bg-amber-200">
                            Dia {c.birthday.split('-')[2]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seção de Visitas Normais */}
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-3 px-1">Atendimentos no Mês</div>
                  <div className="space-y-1.5">
                    {m.clients.length > 0 ? m.clients.map((cName, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleClientClick(cName)}
                        className="w-full text-left text-xs text-slate-700 p-2.5 bg-white rounded-lg border border-slate-100 hover:border-[#00a884] hover:text-[#00a884] hover:shadow-sm transition-all font-medium flex items-center justify-between"
                      >
                        <span className="truncate">{cName}</span>
                        <i className="fa-solid fa-chevron-right text-[8px] opacity-0 group-hover:opacity-100"></i>
                      </button>
                    )) : (
                      <div className="text-[10px] text-slate-300 italic px-1 py-4 text-center border-2 border-dashed rounded-xl">Nenhuma visita registrada</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'estrategias' && (
        <div className="space-y-6">
          <div className="bg-[#00a884] p-8 rounded-[2rem] text-white shadow-lg relative overflow-hidden">
             <div className="relative z-10">
                <h2 className="text-2xl font-black mb-2">Funil de Relacionamento</h2>
                <p className="text-sm opacity-90 max-w-lg">A Clara separou as melhores abordagens para cada momento da sua cliente.</p>
             </div>
             <i className="fa-solid fa-bullseye absolute right-10 top-1/2 -translate-y-1/2 text-white/10 text-9xl"></i>
          </div>

          {activeStrategy === 'inativas' && automaticReminders.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-amber-800 font-black text-sm uppercase flex items-center gap-2">
                  <i className="fa-solid fa-bolt"></i> Lembretes de Hoje (Inativas Prioritárias)
                </h3>
                <span className="text-[10px] bg-amber-200 text-amber-800 px-3 py-1 rounded-full font-black">
                  {automaticReminders.length} Pendentes
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {automaticReminders.map(c => (
                  <div key={c.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between group">
                    <div>
                      <div className="font-black text-slate-800 text-sm">{c.name}</div>
                      <div className="text-[10px] text-amber-500 font-bold uppercase">{c.reminderType} ({c.diffDays} dias)</div>
                    </div>
                    <button 
                      onClick={() => window.open(`https://wa.me/${c.phone}?text=${encodeURIComponent(`Oi ${c.name}, estamos com saudades! Notamos que faz ${c.diffDays} dias que não nos visita. Vamos agendar seu retorno?`)}`)}
                      className="bg-[#00a884] text-white px-4 py-2 rounded-lg text-[10px] font-black hover:bg-[#008f6f] transition-all"
                    >
                      COBRAR AGORA
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex bg-slate-200/50 p-1 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'posvenda', label: 'Pós-Venda', icon: 'fa-star' },
              { id: 'ativas', label: 'Clientes Ativas', icon: 'fa-heart' },
              { id: 'inativas', label: 'Inativas (Resgate)', icon: 'fa-ghost' },
              { id: 'prospeccao', label: 'Prospecção', icon: 'fa-magnifying-glass' }
            ].map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveStrategy(cat.id as StrategyCategory)}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeStrategy === cat.id ? 'bg-white text-[#00a884] shadow-sm scale-[1.02]' : 'text-slate-500 hover:bg-white/50'}`}
              >
                <i className={`fa-solid ${cat.icon}`}></i> {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {categorizedClients.length > 0 ? categorizedClients.map(c => (
              <div key={c.id} className="bg-white border rounded-2xl p-6 hover:shadow-xl transition-all border-b-4 border-b-[#00a884]/20 group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-black text-slate-800 text-lg group-hover:text-[#00a884] transition-colors">{c.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.phone}</div>
                  </div>
                  <div className={`text-[10px] font-black px-3 py-1 rounded-full ${c.diffDays > 30 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {c.diffDays === 0 ? 'Veio Hoje' : `${c.diffDays} dias offline`}
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 mb-6">
                   <div className="text-[9px] font-black text-slate-400 uppercase mb-2">Sugestão da Clara:</div>
                   <p className="text-xs text-slate-600 italic leading-relaxed">"{c.strategyMsg}"</p>
                </div>

                <div className="flex gap-2">
                  <button 
                    disabled={!whatsappConnected}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${whatsappConnected ? 'bg-[#00a884] text-white hover:bg-[#008f6f] shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                    <i className="fa-solid fa-robot"></i> Clara, enviar agora
                  </button>
                  <button 
                    onClick={() => window.open(`https://wa.me/${c.phone}?text=${encodeURIComponent(c.strategyMsg)}`)}
                    className="px-6 py-3 border-2 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Manual
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                 <i className="fa-solid fa-face-smile text-slate-200 text-6xl mb-4"></i>
                 <p className="text-slate-400 font-bold">Nenhuma cliente nesta categoria no momento.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'relatorios' && (
        <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
          <div className="p-8 border-b bg-slate-50 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ClientStatus)} className="text-sm font-bold border rounded-xl p-3 bg-white outline-none focus:ring-2 ring-[#00a884]/20">
                  <option value="todos">Todos os Status</option>
                  <option value="ativos">Ativos (vêm sempre)</option>
                  <option value="inativos">Inativos (parados)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Mês</label>
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="text-sm font-bold border rounded-xl p-3 bg-white outline-none focus:ring-2 ring-[#00a884]/20">
                  <option value="todos">Todos os Meses</option>
                  {ALL_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b">
                <tr>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Cliente</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Contato</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-right">Faturamento Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredClients.map(c => (
                  <tr key={c.id} onClick={() => setSelectedClient(c)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <td className="p-6 font-bold text-slate-700 text-sm group-hover:text-[#00a884]">{c.name}</td>
                    <td className="p-6 text-slate-500 text-sm font-mono">{c.phone}</td>
                    <td className="p-6 text-right font-black text-[#00a884] text-sm">R$ {c.totalSpent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'conexao' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#00a884]/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-4xl font-black mb-6">Conectar WhatsApp</h2>
                <p className="text-slate-400 mb-10 leading-relaxed text-lg">
                  Ative o poder da Clara! Com a conexão ativa, as mensagens de pós-venda e resgate são enviadas em um clique.
                </p>
                {!whatsappConnected ? (
                  <button 
                    onClick={startConnect}
                    disabled={isLoading}
                    className="w-full md:w-auto bg-[#00a884] hover:bg-[#008f6f] text-white font-black py-5 px-12 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-4 text-lg"
                  >
                    {isLoading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : <i className="fa-solid fa-qrcode"></i>}
                    GERAR NOVA CONEXÃO
                  </button>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex items-center gap-5 text-emerald-400 font-black text-xl">
                    <i className="fa-solid fa-check-circle text-3xl"></i> WHATSAPP ATIVO
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
