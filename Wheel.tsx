import React, { useState, useRef } from 'react';
import { WheelSector } from './types';
import { sound } from './sound';
import { RotateCw, Sparkles } from 'lucide-react';

interface WheelProps {
  onSpinEnd: (sector: WheelSector) => void;
  disabled?: boolean;
}

const SECTORS: WheelSector[] = [
  { label: '500', points: 500, color: '#f59e0b', type: 'points' },
  { label: '100', points: 100, color: '#3b82f6', type: 'points' },
  { label: 'ԲԱՑԵԼ (+)', points: 0, color: '#10b981', type: 'open_letter' },
  { label: '250', points: 250, color: '#8b5cf6', type: 'points' },
  { label: '750', points: 750, color: '#ec4899', type: 'points' },
  { label: 'x2', points: 0, color: '#f97316', type: 'double' },
  { label: '300', points: 300, color: '#06b6d4', type: 'points' },
  { label: '1000', points: 1000, color: '#eab308', type: 'points' },
];

export const Wheel: React.FC<WheelProps> = ({ onSpinEnd, disabled = false }) => {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [selectedSector, setSelectedSector] = useState<WheelSector | null>(null);
  const lastTickAngle = useRef(0);

  const numSectors = SECTORS.length;
  const sectorAngle = 360 / numSectors;

  const spin = () => {
    if (spinning || disabled) return;

    setSpinning(true);
    setSelectedSector(null);

    // Pick random target sector
    const targetIdx = Math.floor(Math.random() * numSectors);
    // Extra full turns (4 to 7 turns)
    const extraTurns = (4 + Math.floor(Math.random() * 4)) * 360;
    // Angle offset to land on middle of sector
    const targetAngle = extraTurns + (360 - targetIdx * sectorAngle - sectorAngle / 2);

    const newRotation = rotation + targetAngle;
    setRotation(newRotation);

    // Click sound ticking
    let currentStep = 0;
    const totalTicks = 24;
    const tickInterval = setInterval(() => {
      sound.playSpinClick();
      currentStep++;
      if (currentStep >= totalTicks) {
        clearInterval(tickInterval);
      }
    }, 120);

    setTimeout(() => {
      setSpinning(false);
      const landed = SECTORS[targetIdx];
      setSelectedSector(landed);
      sound.playLetterFlip();
      onSpinEnd(landed);
    }, 3200);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Drum pointer / arrow */}
      <div className="relative flex flex-col items-center">
        {/* Pointer at the top */}
        <div className="z-20 -mb-3">
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] animate-pulse" />
        </div>

        {/* Rotating Wheel Container */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full p-2 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-2xl border-4 border-amber-300">
          <div className="w-full h-full rounded-full overflow-hidden relative shadow-inner bg-slate-900">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full transform transition-transform duration-[3200ms] ease-out"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {SECTORS.map((sector, idx) => {
                const startAngle = idx * sectorAngle;
                const endAngle = startAngle + sectorAngle;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;

                const x1 = 100 + 100 * Math.cos(startRad);
                const y1 = 100 + 100 * Math.sin(startRad);
                const x2 = 100 + 100 * Math.cos(endRad);
                const y2 = 100 + 100 * Math.sin(endRad);

                const midAngle = startAngle + sectorAngle / 2;
                const midRad = (midAngle * Math.PI) / 180;
                const textX = 100 + 64 * Math.cos(midRad);
                const textY = 100 + 64 * Math.sin(midRad);

                return (
                  <g key={idx}>
                    <path
                      d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                      fill={sector.color}
                      stroke="#1e1b4b"
                      strokeWidth="1.5"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                      className="drop-shadow-md select-none tracking-wider"
                    >
                      {sector.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Center Cap */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border-4 border-amber-100 shadow-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-slate-900" />
            </div>
          </div>
        </div>
      </div>

      {/* Spin Button */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <button
          onClick={spin}
          disabled={spinning || disabled}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all shadow-lg ${
            spinning || disabled
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-75'
              : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95'
          }`}
        >
          <RotateCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
          {spinning ? 'Թմբուկը պտտվում է... (Крутится)' : 'Պտտել թմբուկը · Крутить барабан'}
        </button>

        {selectedSector && !spinning && (
          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-bounce">
            {selectedSector.type === 'points' && `Շահում: +${selectedSector.points} միավոր!`}
            {selectedSector.type === 'open_letter' && `Սեկտոր +: Բոնուս տառի հնարավորություն!`}
            {selectedSector.type === 'double' && `Սեկտոր x2: Միավորները կրկնապատկվում են!`}
          </div>
        )}
      </div>
    </div>
  );
};
