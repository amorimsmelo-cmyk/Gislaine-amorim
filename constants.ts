
import { Client, Appointment } from './types';

export const CLARA_SYSTEM_PROMPT = `
Você é Clara, a IA oficial do SaaS CONECTA CLIENTES para salões de beleza.
Seu papel é ser estrategista comercial, organizadora, registradora de atendimentos e agora você pode enviar mensagens diretamente se o WhatsApp estiver conectado.

INSTRUÇÕES PARA CONEXÃO (Se o usuário não souber o que fazer):
1. Peça para ele ir até a aba "Painel & Conexão" no menu lateral esquerdo.
2. Lá, ele deve clicar no botão "GERAR NOVA CONEXÃO".
3. No celular dele, ele deve:
   a) Abrir o WhatsApp.
   b) Ir em "Configurações" ou nos "Três Pontinhos" no topo.
   c) Selecionar "Aparelhos Conectados".
   d) Tocar em "Conectar um Aparelho" e aponte a câmera para o QR Code que aparecerá na tela do sistema.

DIRETRIZES GERAIS:
1. Comunicação Clara, Objetiva e Estratégica.
2. WhatsApp é o canal principal. Responda de forma prática.
3. SEMPRE use o contexto de dados do salão fornecido.
4. REGISTRO DE ATENDIMENTO: Extraia Nome, Telefone, Data, Serviço e Valor e peça confirmação.
5. ESTRATÉGIA DE RESGATE: Ao sugerir uma mensagem, pergunte se o usuário quer que você envie ou se ele prefere manual.
6. Se o usuário pedir para você enviar, confirme o envio.

OBJETIVO COMERCIAL: Proatividade. Ajude o dono do salão a não perder tempo e a vender mais.
`;

export const INITIAL_CLIENTS: Client[] = [
  { 
    id: '1', name: 'Maria Silva', phone: '11988880000', lastVisit: '2023-12-15', 
    birthday: '1990-12-20', memberSince: '2022-01-10',
    servicesCount: 5, totalSpent: 1250, category: 'Cabelo' 
  },
  { 
    id: '2', name: 'Ana Oliveira', phone: '11977771111', lastVisit: '2024-01-05', 
    birthday: '1985-01-12', memberSince: '2023-05-20',
    servicesCount: 2, totalSpent: 400, category: 'Unhas' 
  },
  { 
    id: '3', name: 'Juliana Costa', phone: '11966662222', lastVisit: '2023-11-20', 
    birthday: '1995-03-15', memberSince: '2021-11-05',
    servicesCount: 8, totalSpent: 3200, category: 'Misto' 
  },
  { 
    id: '4', name: 'Carla Souza', phone: '11955553333', lastVisit: '2024-01-10', 
    birthday: '1992-06-18', memberSince: '2023-12-01',
    servicesCount: 1, totalSpent: 150, category: 'Estética' 
  },
  { 
    id: '5', name: 'Beatriz Lima', phone: '11944445555', lastVisit: '2023-10-05', 
    birthday: '1988-10-22', memberSince: '2022-08-15',
    servicesCount: 3, totalSpent: 600, category: 'Cabelo' 
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 'a1', clientId: '1', clientName: 'Maria Silva', phone: '11988880000', date: '2023-12-15', service: 'Progressiva', value: 350, month: 'Dezembro', confirmed: true },
  { id: 'a2', clientId: '2', clientName: 'Ana Oliveira', phone: '11977771111', date: '2024-01-02', service: 'Manicure', value: 50, month: 'Janeiro', confirmed: true },
  { id: 'a3', clientId: '3', clientName: 'Juliana Costa', phone: '11966662222', date: '2024-01-05', service: 'Corte', value: 120, month: 'Janeiro', confirmed: true },
];
