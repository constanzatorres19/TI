import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { Home } from "./pages/Home";
import { Agenda } from "./pages/Agenda";
import { DigitalTwin } from "./pages/DigitalTwin";
import { MechanicDashboard } from "./pages/MechanicDashboard";
import { Opiniones } from "./pages/Opiniones"; // <-- Importamos la nueva página

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: Home },
      { path: "agendar", Component: Agenda },
      { path: "estado", Component: DigitalTwin },
      { path: "opiniones", Component: Opiniones }, // <-- Nueva ruta
      { path: "mecanico", Component: MechanicDashboard },
    ],
  },
]);
