export type CarPart = 
  | "engine" 
  | "brakes" 
  | "suspension" 
  | "body" 
  | "electrical" 
  | "cooling" 
  | "fuel" 
  | "exhaust" 
  | "transmission" 
  | "ready";

export interface Message {
  id: string;
  sender: 'client' | 'mechanic';
  text: string;
  timestamp: string;
}

export interface Mechanic {
  id: string;
  name: string;
}

export interface BudgetItem {
  description: string;
  price: number;
}

export interface Budget {
  items: BudgetItem[];
  total: number;
  status: 'pending' | 'accepted' | 'rejected';
  selectedParts: CarPart[];
}

export interface VehicleStatus {
  plate: string;
  brand: string;
  model: string;
  clientEmail: string;
  entryDate: string;
  progress: number;
  activePart: CarPart;
  statusText: string;
  mechanic: string;
  service: string;
  messages: Message[];
  budget?: Budget; 
  completedParts?: CarPart[];
  surveyCompleted?: boolean;
  photos?: {
    before?: string;
    after?: string;
  };
  estimatedTime?: string;
  timeStatus?: 'on_time' | 'warning' | 'delayed';
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "rejected" | "reschedule_proposed";

export interface Appointment {
  id: string;
  customerName: string;
  clientEmail: string;
  phone: string;
  plate: string;
  brand: string;
  model: string;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  proposedDate?: string;
  proposedTime?: string;
  estimatedTime?: string;
}

export interface RepairHistory {
  id: string;
  plate: string;
  clientEmail: string;
  brand: string;
  model: string;
  service: string;
  deliveryDate: string;
  activePart: CarPart;
  mechanic: string;
  notes: string;
  originalPhoto?: string;
  surveyStatus?: 'pending' | 'perfect' | 'problem';
  isClosed?: boolean;
  deliverySurveyCompleted?: boolean;
}

export interface WarrantyClaim {
  id: string;
  repairId: string;
  type: 'ruido' | 'fuga' | 'duda' | 'otro' | 'survey_problem';
  comment: string;
  date: string;
  status: 'pending' | 'in_progress' | 'resolved';
  priority: 'Garantía Prioritaria' | 'Revisión Post-Venta';
  plate: string;
  messages?: Message[];
}
// Agrega esto al final de src/app/types.ts
export interface Opinion {
  id: string;
  authorName: string;
  rating: number; // 1 a 5 estrellas
  comment: string;
  date: string;
}
