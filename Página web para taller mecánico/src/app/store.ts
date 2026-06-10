import { VehicleStatus, Appointment, RepairHistory, WarrantyClaim, Mechanic, Opinion } from "./types";
import { format, subDays } from "date-fns";

const today = format(new Date(), "yyyy-MM-dd");
const tenDaysAgo = format(subDays(new Date(), 10), "yyyy-MM-dd");
const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const fortyDaysAgo = format(subDays(new Date(), 40), "yyyy-MM-dd");

export const mockMechanics: Mechanic[] = [
  { id: "M-1", name: "Carlos Mendoza"},
  { id: "M-2", name: "Luis Silva"},
  { id: "M-3", name: "Juan Torres"}
];

export const mockVehicles: Record<string, VehicleStatus> = {
  "ABCD-12": {
    plate: "ABCD-12",
    brand: "Toyota",
    model: "Yaris",
    clientEmail: "test@taller.com",
    entryDate: "14 May 2024",
    progress: 40,
    activePart: "engine",
    statusText: "Revisión de bujías y cambio de aceite en proceso.",
    mechanic: "Carlos Mendoza",
    service: "Mantención por Kilometraje",
    estimatedTime: "2 días hábiles",
    timeStatus: "warning",
    messages: [
      { id: "m1", sender: "client", text: "¿Estará listo para mañana en la tarde?", timestamp: "10:30" },
      { id: "m2", sender: "mechanic", text: "Hola, estamos revisando el motor. Te confirmaré durante la tarde.", timestamp: "11:00" }
    ],
    photos: {
      before: "https://images.unsplash.com/photo-1486262715619-67081ce77451?q=80&w=300&auto=format&fit=crop",
      after: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=300&auto=format&fit=crop"
    }
  },
  "WXYZ-99": {
    plate: "WXYZ-99",
    brand: "Ford",
    model: "Ranger",
    entryDate: "15 May 2024",
    progress: 80,
    activePart: "brakes",
    statusText: "Cambio de pastillas y rectificación de discos.",
    mechanic: "Luis Silva",
    service: "Revisión de Frenos",
    estimatedTime: "1 día hábil",
    timeStatus: "delayed",
    messages: []
  },
  "READY-01": {
    plate: "READY-01",
    brand: "Honda",
    model: "Civic",
    entryDate: "10 May 2024",
    progress: 100,
    activePart: "ready",
    statusText: "Reparación completada. Listo para retiro.",
    mechanic: "Ana Torres",
    service: "Problemas de Motor",
    estimatedTime: "4 horas",
    timeStatus: "on_time",
    messages: []
  }
};

export const mockAppointments: Appointment[] = [
  {
    id: "R-A1B2C",
    customerName: "Juan Pérez",
    phone: "9 1234 5678",
    plate: "JUAN-01",
    brand: "Chevrolet",
    model: "Spark",
    service: "Mantención por Kilometraje",
    date: today,
    time: "10:00",
    status: "pending"
  },
  {
    id: "R-X9Y8Z",
    customerName: "María González",
    phone: "9 8765 4321",
    plate: "MARI-02",
    brand: "Nissan",
    model: "Qashqai",
    service: "Revisión de Frenos",
    date: today,
    time: "14:00",
    status: "confirmed",
    estimatedTime: "1 día hábil"
  }
];

export const mockHistory: Record<string, RepairHistory[]> = {
  "ABCD-12": [
    {
      id: "H-1",
      plate: "ABCD-12",
      brand: "Toyota",
      model: "Yaris",
      service: "Cambio de pastillas de freno",
      deliveryDate: tenDaysAgo,
      activePart: "ready",
      mechanic: "Carlos Mendoza",
      notes: "Se cambiaron pastillas delanteras y se rectificaron discos.",
      originalPhoto: "https://images.unsplash.com/photo-1486262715619-67081ce77451?q=80&w=250&auto=format&fit=crop",
      surveyStatus: "pending"
    },
    {
      id: "H-2",
      plate: "ABCD-12",
      brand: "Toyota",
      model: "Yaris",
      service: "Revisión de Motor",
      deliveryDate: thirtyDaysAgo,
      activePart: "engine",
      mechanic: "Luis Silva",
      notes: "Ajuste de válvulas y revisión de inyectores.",
      originalPhoto: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=250&auto=format&fit=crop",
      surveyStatus: "pending"
    },
    {
      id: "H-3",
      plate: "ABCD-12",
      brand: "Toyota",
      model: "Yaris",
      service: "Cambio de aceite y filtros",
      deliveryDate: fortyDaysAgo,
      activePart: "engine",
      mechanic: "Luis Silva",
      notes: "Mantención regular de los 50.000 km.",
      isClosed: true
    }
  ]
};

export const mockWarrantyClaims: WarrantyClaim[] = [];
export const mockOpinions: Opinion[] = [
  {
    id: "OP-1",
    authorName: "Juan Pérez",
    rating: 5,
    comment: "Excelente servicio. Fui por una mantención de kilometraje y me explicaron todo el presupuesto con claridad a través del Gemelo Digital. ¡Muy recomendados!",
    date: "10/05/2024"
  },
  {
    id: "OP-2",
    authorName: "María González",
    rating: 4,
    comment: "Buen trabajo con mis frenos. Se demoraron un poco más de lo esperado en entregar el auto, pero la comunicación con el mecánico por el chat fue fluida.",
    date: "12/05/2024"
  }
];
