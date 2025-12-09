'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

interface Racer {
  id: string;
  name: string;
  surface: string;
  color: string;
  position: number;
  speed: number;
  friction: number;
  acceleration: number;
  emoji: string;
}

export default function FrictionRacers() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [racers, setRacers] = useState<Racer[]>([]);
  const [racing, setRacing] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [winner, setWinner] = useState<Racer | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [selectedRacer, setSelectedRacer] = useState<string>('');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const gameLoopRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);

  // Surface types with different friction coefficients
  const surfaceTypes = [
    { 
      name: 'Ice', 
      friction: 0.02, 
      color: '#a5f3fc', 
      emoji: '❄️',
      description: 'Very low friction - slides fast but hard to control'
    },
    { 
      name: 'Wood', 
      friction: 0.04, 
      color: '#fcd34d', 
      emoji: '🪵',
      description: 'Low-medium friction - balanced speed and control'
    },
    { 
      name: 'Concrete', 
      friction: 0.06, 
      color: '#9ca3af', 
      emoji: '🏗️',
      description: 'Medium friction - steady and reliable'
    },
    { 
      name: 'Rough Ground', 
      friction: 0.1, 
      color: '#92400e', 
      emoji: '🌋',
      description: 'High friction - slower but very stable'
    }
  ];

  const initializeRacers = useCallback(() => {
    const newRacers: Racer[] = surfaceTypes.map((surface, index) => ({
      id: `racer-${index}`,
      name: `Racer ${index + 1}`,
      surface: surface.name,
      color: surface.color,
      position: 0,
      speed: 0,
      friction: surface.friction,
      acceleration: 0.5, // Base acceleration for all racers
      emoji: surface.emoji
    }));
    setRacers(newRacers);
  }, []);

  useEffect(() => {
    setMounted(true);
    initializeRacers();

    const updateCanvasSize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth < 1024;

      if (isMobile) {
        setCanvasSize({
          width: Math.min(window.innerWidth - 32, 400),
          height: Math.min(window.innerHeight - 250, 600)
        });
      } else if (isTablet) {
        setCanvasSize({ width: 600, height: 600 });
      } else {
        setCanvasSize({ width: 800, height: 600 });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [initializeRacers]);

  const updateRace = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !racing) return;

    const finishLine = canvas.height - 100;

    setRacers(prev => {
      const updated = prev.map(racer => {
        if (racer.position >= finishLine) {
          return racer; // Already finished
        }

        // Apply acceleration
        let newSpeed = racer.speed + racer.acceleration;
        
        // Apply friction (reduces speed)
        newSpeed = newSpeed * (1 - racer.friction);
        
        // Max speed limit
        newSpeed = Math.min(newSpeed, 8);

        const newPosition = racer.position + newSpeed;

        return {
          ...racer,
          speed: newSpeed,
          position: Math.min(newPosition, finishLine)
        };
      });

      // Check for winner
      const finished = updated.filter(r => r.position >= finishLine);
      if (finished.length > 0 && !raceFinished) {
        // Sort by position to find actual winner (in case of tie, first to cross)
        const actualWinner = updated.reduce((prev, current) => 
          current.position >= finishLine && !prev ? current : prev
        );
        setWinner(actualWinner);
        setRaceFinished(true);
        setRacing(false);
      }

      return updated;
    });
  }, [racing, raceFinished]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient (vertical)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#dbeafe');
    gradient.addColorStop(0.5, '#e0f2fe');
    gradient.addColorStop(1, '#f0f9ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw start line
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(canvas.width, 50);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw "START" text
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('START', canvas.width / 2, 40);

    // Draw finish line
    const finishY = canvas.height - 100;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(0, finishY);
    ctx.lineTo(canvas.width, finishY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw "FINISH" text
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('FINISH', canvas.width / 2, finishY + 25);

    // Draw lanes and racers
    const laneWidth = canvas.width / racers.length;
    
    racers.forEach((racer, index) => {
      const laneX = index * laneWidth;
      
      // Draw lane separator
      if (index > 0) {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(laneX, 0);
        ctx.lineTo(laneX, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw surface texture/color
      ctx.fillStyle = racer.color;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(laneX, 0, laneWidth, canvas.height);
      ctx.globalAlpha = 1;

      // Draw racer (car/object)
      const racerX = laneX + laneWidth / 2;
      const racerY = 50 + racer.position;
      const racerSize = Math.min(laneWidth * 0.6, 60);

      // Highlight selected racer
      if (racer.surface === selectedRacer) {
        ctx.save();
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(racerX, racerY, racerSize / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw racer circle
      ctx.fillStyle = racer.color;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(racerX, racerY, racerSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw emoji on racer
      ctx.font = `${racerSize * 0.5}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(racer.emoji, racerX, racerY);

      // Draw surface name below racer
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(racer.surface, racerX, racerY + racerSize / 2 + 15);

      // Draw speed indicator
      if (racing) {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px Arial';
        ctx.fillText(`${racer.speed.toFixed(1)} m/s`, racerX, racerY + racerSize / 2 + 28);
      }
    });

    // Draw race progress
    if (racing && racers.length > 0) {
      const maxPosition = Math.max(...racers.map(r => r.position));
      const progress = Math.min((maxPosition / (canvas.height - 150)) * 100, 100);
      
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Progress: ${progress.toFixed(0)}%`, 10, 20);
    }
  }, [racers, racing, selectedRacer]);

  useEffect(() => {
    if (mounted) {
      const loop = () => {
        updateRace();
        draw();
        gameLoopRef.current = requestAnimationFrame(loop);
      };
      gameLoopRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [mounted, updateRace, draw]);

  const startRace = () => {
    initializeRacers();
    setRacing(true);
    setRaceFinished(false);
    setWinner(null);
  };

  const resetRace = () => {
    initializeRacers();
    setRacing(false);
    setRaceFinished(false);
    setWinner(null);
    setSelectedRacer('');
  };

  const closeInstructions = () => {
    setShowInstructions(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100 flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full blur-3xl"></div>
      </div>

      <div className="text-center mb-3 sm:mb-6 relative z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 mb-2 sm:mb-3 drop-shadow-lg">
          🏁 Friction Racers
        </h1>
        <p className="text-slate-600 text-sm sm:text-lg font-semibold px-4 bg-white/50 backdrop-blur-sm rounded-full py-2 border border-blue-200 shadow-lg">
          See how friction affects motion!
        </p>
      </div>

      {!racing && !raceFinished && !showInstructions && (
        <div className="mb-4 relative z-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-blue-200 mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 text-center">
              Select a racer to predict the winner:
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {surfaceTypes.map((surface) => (
                <button
                  key={surface.name}
                  onClick={() => setSelectedRacer(surface.name)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                    selectedRacer === surface.name
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                      : 'border-slate-300 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="text-3xl mb-1">{surface.emoji}</div>
                  <div className="font-bold text-sm">{surface.name}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Friction: {(surface.friction * 100).toFixed(0)}%
                  </div>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={startRace}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🏁 Start Race
          </button>
        </div>
      )}

      <div className="relative z-10">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border-4 border-white/30 rounded-3xl shadow-2xl bg-white max-w-full"
        />
      </div>

      {racing && (
        <div className="mt-4 text-center relative z-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg border border-blue-200">
            <p className="text-slate-700 font-semibold text-sm sm:text-base">
              🏃 Race in progress...
            </p>
          </div>
        </div>
      )}

      {raceFinished && winner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-10 text-center shadow-2xl max-w-md mx-4">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
              Race Complete!
            </h2>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 mb-6 border-2 border-yellow-300">
              <div className="text-5xl mb-2">{winner.emoji}</div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {winner.surface}
              </h3>
              <p className="text-slate-600">
                Friction coefficient: {(winner.friction * 100).toFixed(0)}%
              </p>
            </div>
            
            {selectedRacer && (
              <div className={`mb-6 p-4 rounded-xl ${
                selectedRacer === winner.surface 
                  ? 'bg-green-100 border-2 border-green-500' 
                  : 'bg-red-100 border-2 border-red-500'
              }`}>
                <p className="font-bold text-lg">
                  {selectedRacer === winner.surface 
                    ? '🎯 Your prediction was correct!' 
                    : `❌ You predicted ${selectedRacer}`}
                </p>
              </div>
            )}

            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
              <h4 className="font-bold text-slate-800 mb-2">💡 Science Fact:</h4>
              <p className="text-sm text-slate-700">
                Lower friction means less resistance to motion. {winner.surface} had the lowest 
                friction ({(winner.friction * 100).toFixed(0)}%), allowing it to maintain higher speed 
                and win the race!
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={resetRace}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                🔄 Race Again
              </button>
              <Link
                href="/science"
                className="block w-full bg-slate-500 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                ← Back to Science Games
              </Link>
            </div>
          </div>
        </div>
      )}

      {!racing && !raceFinished && !showInstructions && (
        <Link
          href="/science"
          className="mt-4 sm:mt-6 text-slate-600 hover:text-blue-600 transition-all duration-300 font-semibold relative z-10 text-sm sm:text-base bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200 hover:border-blue-400 hover:shadow-lg transform hover:scale-105"
        >
          ← Back to Science Games
        </Link>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-blue-50 to-cyan-50 rounded-3xl p-6 sm:p-10 text-center max-w-2xl shadow-2xl border-4 border-white/30">
            <div className="text-5xl mb-4">🏁</div>
            <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 mb-3">
              Friction Racers
            </h2>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-6">
              Learn About Friction & Motion
            </h3>
            
            <div className="bg-white rounded-2xl p-6 mb-6 border border-blue-200 text-left">
              <h4 className="font-bold text-lg text-slate-800 mb-3">🎯 How to Play:</h4>
              <div className="space-y-2 text-slate-700">
                <p className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  <span>Four racers will compete on different surfaces</span>
                </p>
                <p className="flex items-start">
                  <span className="text-cyan-500 font-bold mr-3">•</span>
                  <span>Each surface has a different friction coefficient</span>
                </p>
                <p className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">•</span>
                  <span>Select which racer you think will win</span>
                </p>
                <p className="flex items-start">
                  <span className="text-cyan-500 font-bold mr-3">•</span>
                  <span>Watch how friction affects their speed!</span>
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 mb-6 border border-blue-200 text-left">
              <h4 className="font-bold text-lg text-slate-800 mb-3">📚 Science Concepts:</h4>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="bg-white rounded-lg p-3">
                  <p className="font-semibold text-blue-600">Friction:</p>
                  <p>A force that opposes motion between two surfaces in contact</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="font-semibold text-cyan-600">Lower Friction = Higher Speed:</p>
                  <p>Smooth surfaces (like ice) have less friction, allowing faster movement</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="font-semibold text-blue-600">Higher Friction = Slower Speed:</p>
                  <p>Rough surfaces create more resistance, slowing down objects</p>
                </div>
              </div>
            </div>

            <button
              onClick={closeInstructions}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-12 rounded-2xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Let&apos;s Race! 🏁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
