
export interface Client {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
  birthday: string; // Formato YYYY-MM-DD
  memberSince: string; // Formato YYYY-MM-DD
  servicesCount: number;
  totalSpent: number;
  category: 'Cabelo' | 'Estética' | 'Unhas' | 'Misto';
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  phone: string;
  date: string;
  service: string;
  value: number;
  month: string;
  confirmed: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  pendingAppointment?: Partial<Appointment>;
}

export interface SalonState {
  id: string;
  name: string;
  clients: Client[];
  appointments: Appointment[];
}
