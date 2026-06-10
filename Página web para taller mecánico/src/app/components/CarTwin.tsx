import { motion } from "motion/react";
import { CarPart } from "../types";

interface CarTwinProps {
  activePart: CarPart;
  overrideColor?: string;
}

export function CarTwin({ activePart, overrideColor }: CarTwinProps) {
  // Map parts to the colors specified in the legend image:
  // Motor = Red (#ef4444)
  // Electrical = Blue (#3b82f6)
  // Cooling = Light Blue (#7dd3fc)
  // Fuel = Light Green (#86efac)
  // Brakes = Dark Green (#166534)
  // Support/Suspension = Orange/Amber (#f59e0b)
  // Exhaust = Yellow (#fde047)
  // Transmission/Power = Purple (#a855f7)
  
  const isReady = activePart === "ready";

  const getPartColor = (part: CarPart) => {
    if (isReady) return overrideColor || "#22c55e"; // Green for ready
    if (activePart !== part) return "currentColor";
    if (overrideColor) return overrideColor;
    
    switch (part) {
      case "engine": return "#ef4444";
      case "electrical": return "#3b82f6";
      case "cooling": return "#7dd3fc";
      case "fuel": return "#86efac";
      case "brakes": return "#166534";
      case "suspension": return "#f59e0b";
      case "exhaust": return "#facc15";
      case "transmission": return "#a855f7";
      case "body": return "#3b82f6";
      default: return "currentColor";
    }
  };

  const getPartOpacity = (part: CarPart) => {
    if (isReady) return part === "body" ? 0.2 : 1;
    return activePart === part ? 1 : 0.15;
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[1/2] p-8 flex items-center justify-center">
      <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-3xl" />
      
      <svg
        viewBox="0 0 200 400"
        className="w-full h-full drop-shadow-2xl text-slate-800 dark:text-slate-200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Car Body Base Outline */}
        <path
          d="M40 80 C40 30, 60 10, 100 10 C140 10, 160 30, 160 80 L160 320 C160 370, 140 390, 100 390 C60 390, 40 370, 40 320 Z"
          stroke="currentColor"
          strokeWidth="4"
          className="opacity-20"
        />

        {/* --- CAR BODY (Chasis / Carrocería) --- */}
        <motion.path
          initial={{
            stroke: getPartColor("body"),
            opacity: getPartOpacity("body"),
            strokeWidth: activePart === "body" ? 6 : 4
          }}
          animate={{
            stroke: getPartColor("body"),
            opacity: getPartOpacity("body"),
            strokeWidth: activePart === "body" ? 6 : 4
          }}
          d="M45 90 C45 40, 65 20, 100 20 C135 20, 155 40, 155 90 L155 310 C155 360, 135 380, 100 380 C65 380, 45 360, 45 310 Z"
          fill={activePart === "body" || isReady ? "currentColor" : "transparent"}
          fillOpacity={activePart === "body" || isReady ? 0.05 : 0}
        />

        {/* --- COOLING (Sistema de refrigeración) - Radiador frontal --- */}
        <motion.g
          initial={{
            color: getPartColor("cooling"),
            opacity: getPartOpacity("cooling"),
            scale: activePart === "cooling" ? 1.05 : 1,
          }}
          animate={{
            color: getPartColor("cooling"),
            opacity: getPartOpacity("cooling"),
            scale: activePart === "cooling" ? 1.05 : 1,
          }}
          style={{ transformOrigin: "100px 30px" }}
        >
          <rect x="65" y="25" width="70" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill={activePart === "cooling" ? "currentColor" : "transparent"} fillOpacity={activePart === "cooling" ? 0.5 : 0} />
          <path d="M70 25 L70 35 M80 25 L80 35 M90 25 L90 35 M100 25 L100 35 M110 25 L110 35 M120 25 L120 35 M130 25 L130 35" stroke="currentColor" strokeWidth="1" />
        </motion.g>

        {/* --- ENGINE (Motor) --- */}
        <motion.g
          initial={{
            color: getPartColor("engine"),
            opacity: getPartOpacity("engine"),
            scale: activePart === "engine" ? 1.05 : 1,
          }}
          animate={{
            color: getPartColor("engine"),
            opacity: getPartOpacity("engine"),
            scale: activePart === "engine" ? 1.05 : 1,
          }}
          style={{ transformOrigin: "100px 60px" }}
        >
          <rect x="75" y="40" width="50" height="45" rx="5" stroke="currentColor" strokeWidth="4" fill={activePart === "engine" ? "currentColor" : "transparent"} fillOpacity={activePart === "engine" ? 0.3 : 0} />
          <circle cx="85" cy="62" r="6" stroke="currentColor" strokeWidth="2" />
          <circle cx="115" cy="62" r="6" stroke="currentColor" strokeWidth="2" />
          <line x1="100" y1="40" x2="100" y2="85" stroke="currentColor" strokeWidth="2" />
        </motion.g>

        {/* --- TRANSMISSION/POWER (Transmisión / Sistema de potencia) --- */}
        <motion.g
          initial={{
            color: getPartColor("transmission"),
            opacity: getPartOpacity("transmission"),
            scale: activePart === "transmission" ? 1.05 : 1,
          }}
          animate={{
            color: getPartColor("transmission"),
            opacity: getPartOpacity("transmission"),
            scale: activePart === "transmission" ? 1.05 : 1,
          }}
          style={{ transformOrigin: "100px 100px" }}
        >
          <path d="M90 85 L110 85 L105 130 L95 130 Z" stroke="currentColor" strokeWidth="3" fill={activePart === "transmission" ? "currentColor" : "transparent"} fillOpacity="0.2" />
          <line x1="100" y1="130" x2="100" y2="330" stroke="currentColor" strokeWidth="4" strokeDasharray="6 4" />
        </motion.g>

        {/* --- ELECTRICAL (Sistema Eléctrico) --- */}
        <motion.g
          initial={{
            color: getPartColor("electrical"),
            opacity: getPartOpacity("electrical"),
          }}
          animate={{
            color: getPartColor("electrical"),
            opacity: getPartOpacity("electrical"),
          }}
        >
          {/* Dashboard wiring */}
          <path d="M60 140 L140 140" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
          <path d="M60 140 L45 90 M140 140 L155 90" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
          {/* Battery */}
          <rect x="130" y="45" width="15" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill={activePart === "electrical" ? "currentColor" : "transparent"} fillOpacity="0.3" />
          <text x="133" y="58" fill="currentColor" fontSize="10" fontWeight="bold">+</text>
        </motion.g>

        {/* --- FUEL (Sistema de combustible) --- */}
        <motion.g
          initial={{
            color: getPartColor("fuel"),
            opacity: getPartOpacity("fuel"),
          }}
          animate={{
            color: getPartColor("fuel"),
            opacity: getPartOpacity("fuel"),
          }}
        >
          {/* Fuel Tank */}
          <rect x="70" y="300" width="60" height="30" rx="8" stroke="currentColor" strokeWidth="3" fill={activePart === "fuel" ? "currentColor" : "transparent"} fillOpacity="0.3" />
          {/* Fuel Line */}
          <path d="M85 300 L85 85" stroke="currentColor" strokeWidth="2" fill="none" />
        </motion.g>

        {/* --- EXHAUST (Sistema de escape) --- */}
        <motion.g
          initial={{
            color: getPartColor("exhaust"),
            opacity: getPartOpacity("exhaust"),
          }}
          animate={{
            color: getPartColor("exhaust"),
            opacity: getPartOpacity("exhaust"),
          }}
        >
          {/* Manifold & Pipe */}
          <path d="M75 60 L60 60 L60 360 L55 365" stroke="currentColor" strokeWidth="3" fill="none" />
          {/* Silencer / Muffler */}
          <rect x="56" y="220" width="8" height="40" rx="3" stroke="currentColor" strokeWidth="3" fill={activePart === "exhaust" ? "currentColor" : "transparent"} fillOpacity="0.4" />
          <rect x="56" y="330" width="8" height="20" rx="2" stroke="currentColor" strokeWidth="3" fill={activePart === "exhaust" ? "currentColor" : "transparent"} fillOpacity="0.4" />
        </motion.g>

        {/* --- SUSPENSION (Sistema de apoyo/suspensión) --- */}
        <motion.g
          initial={{
            color: getPartColor("suspension"),
            opacity: getPartOpacity("suspension"),
          }}
          animate={{
            color: getPartColor("suspension"),
            opacity: getPartOpacity("suspension"),
          }}
        >
          {/* Front Axle */}
          <line x1="45" y1="70" x2="155" y2="70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          {/* Rear Axle */}
          <line x1="45" y1="330" x2="155" y2="330" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          {/* Springs (Visual rep) */}
          <path d="M55 60 Q60 65 55 70 Q50 75 55 80" stroke="currentColor" strokeWidth="3" fill="none" />
          <path d="M145 60 Q140 65 145 70 Q150 75 145 80" stroke="currentColor" strokeWidth="3" fill="none" />
          <path d="M55 320 Q60 325 55 330 Q50 335 55 340" stroke="currentColor" strokeWidth="3" fill="none" />
          <path d="M145 320 Q140 325 145 330 Q150 335 145 340" stroke="currentColor" strokeWidth="3" fill="none" />
        </motion.g>

        {/* --- BRAKES & TIRES (Frenos y Neumáticos) --- */}
        <motion.g
          initial={{
            color: getPartColor("brakes"),
            opacity: getPartOpacity("brakes"),
            scale: activePart === "brakes" ? 1.05 : 1,
          }}
          animate={{
            color: getPartColor("brakes"),
            opacity: getPartOpacity("brakes"),
            scale: activePart === "brakes" ? 1.05 : 1,
          }}
          style={{ transformOrigin: "100px 200px" }}
        >
          {/* Tires */}
          <rect x="25" y="60" width="20" height="45" rx="4" fill="currentColor" opacity="0.8" />
          <rect x="155" y="60" width="20" height="45" rx="4" fill="currentColor" opacity="0.8" />
          <rect x="25" y="290" width="20" height="45" rx="4" fill="currentColor" opacity="0.8" />
          <rect x="155" y="290" width="20" height="45" rx="4" fill="currentColor" opacity="0.8" />
          
          {/* Brakes */}
          {(activePart === "brakes" || isReady) && (
            <>
              <circle cx="45" cy="82" r="8" fill="transparent" stroke={getPartColor("brakes")} strokeWidth="3" />
              <circle cx="155" cy="82" r="8" fill="transparent" stroke={getPartColor("brakes")} strokeWidth="3" />
              <circle cx="45" cy="312" r="8" fill="transparent" stroke={getPartColor("brakes")} strokeWidth="3" />
              <circle cx="155" cy="312" r="8" fill="transparent" stroke={getPartColor("brakes")} strokeWidth="3" />
            </>
          )}
        </motion.g>

      </svg>
    </div>
  );
}
