'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

interface Metal {
  name: string;
  symbol: string;
  color: string;
  properties: string[];
  reactivity: 'High' | 'Medium' | 'Low';
  uses: string;
  emoji: string;
  funFact: string;
}

interface FallingMetal {
  id: string;
  metal: Metal;
  x: number;
  y: number;
  vx: number;
  collected: boolean;
  collectedTime?: number;
}

interface Challenge {
  question: string;
  correctAnswer: string;
  type: 'reactivity' | 'property' | 'use' | 'symbol';
}

export default function MetalMayhem() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallingMetals, setFallingMetals] = useState<FallingMetal[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [basketX, setBasketX] = useState(400);
  const [mounted, setMounted] = useState(false);
  const [combo, setCombo] = useState(0);
  const [challengeTimer, setChallengeTimer] = useState(0);
  
  const gameLoopRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);

  const metals: Metal[] = [
    {
      name: 'Gold',
      symbol: 'Au',
      color: '#ffd700',
      properties: ['Malleable', 'Ductile', 'Good Conductor'],
      reactivity: 'Low',
      uses: 'Jewelry, Electronics',
      emoji: '🥇',
      funFact: 'Gold is so soft you can scratch it with your fingernail!'
    },
    {
      name: 'Silver',
      symbol: 'Ag',
      color: '#c0c0c0',
      properties: ['Best Conductor', 'Malleable', 'Antibacterial'],
      reactivity: 'Low',
      uses: 'Coins, Mirrors, Medicine',
      emoji: '🥈',
      funFact: 'Silver is the best conductor of electricity among all metals!'
    },
    {
      name: 'Copper',
      symbol: 'Cu',
      color: '#b87333',
      properties: ['Excellent Conductor', 'Ductile', 'Antimicrobial'],
      reactivity: 'Medium',
      uses: 'Wires, Pipes, Coins',
      emoji: '🔶',
      funFact: 'Copper turns green when exposed to air due to oxidation!'
    },
    {
      name: 'Iron',
      symbol: 'Fe',
      color: '#808080',
      properties: ['Magnetic', 'Strong', 'Abundant'],
      reactivity: 'Medium',
      uses: 'Construction, Tools, Vehicles',
      emoji: '⚙️',
      funFact: 'Iron is the most used metal in the world!'
    },
    {
      name: 'Aluminum',
      symbol: 'Al',
      color: '#a8a9ad',
      properties: ['Lightweight', 'Corrosion Resistant', 'Recyclable'],
      reactivity: 'Medium',
      uses: 'Aircraft, Cans, Foil',
      emoji: '✈️',
      funFact: 'Aluminum is the most abundant metal in Earth\'s crust!'
    },
    {
      name: 'Sodium',
      symbol: 'Na',
      color: '#ffa500',
      properties: ['Soft', 'Reactive', 'Floats on Water'],
      reactivity: 'High',
      uses: 'Table Salt, Batteries',
      emoji: '🧂',
      funFact: 'Sodium reacts explosively with water!'
    },
    {
      name: 'Zinc',
      symbol: 'Zn',
      color: '#7f8c8d',
      properties: ['Corrosion Resistant', 'Brittle', 'Protective Coating'],
      reactivity: 'Medium',
      uses: 'Galvanization, Batteries',
      emoji: '🔋',
      funFact: 'Zinc is essential for human immune system!'
    },
    {
      name: 'Titanium',
      symbol: 'Ti',
      color: '#95a5a6',
      properties: ['Strong', 'Lightweight', 'Corrosion Resistant'],
      reactivity: 'Low',
      uses: 'Aircraft, Medical Implants',
      emoji: '🦾',
      funFact: 'Titanium is as strong as steel but 45% lighter!'
    }
  ];

  const generateChallenge = useCallback((): Challenge => {
    const metal = metals[Math.floor(Math.random() * metals.length)];
    const types: ('reactivity' | 'property' | 'use' | 'symbol')[] = ['reactivity', 'property', 'use', 'symbol'];
    const type = types[Math.floor(Math.random() * types.length)];

    switch (type) {
      case 'reactivity':
        return {
          question: `Collect metals with ${metal.reactivity} reactivity`,
          correctAnswer: metal.reactivity,
          type: 'reactivity'
        };
      case 'property':
        const property = metal.properties[Math.floor(Math.random() * metal.properties.length)];
        return {
          question: `Collect metals that are ${property}`,
          correctAnswer: property,
          type: 'property'
        };
      case 'use':
        return {
          question: `Collect ${metal.name}`,
          correctAnswer: metal.name,
          type: 'use'
        };
      case 'symbol':
        return {
          question: `Collect the metal with symbol ${metal.symbol}`,
          correctAnswer: metal.symbol,
          type: 'symbol'
        };
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    const updateCanvasSize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth < 1024;

      if (isMobile) {
        setCanvasSize({
          width: Math.min(window.innerWidth - 32, 450),
          height: 400
        });
      } else if (isTablet) {
        setCanvasSize({ width: 700, height: 500 });
      } else {
        setCanvasSize({ width: 900, height: 600 });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const spawnMetal = useCallback(() => {
    if (!mounted || !currentChallenge) return;

    const metal = metals[Math.floor(Math.random() * metals.length)];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newMetal: FallingMetal = {
      id: `${Date.now()}-${Math.random()}`,
      metal,
      x: Math.random() * (canvas.width - 100) + 50,
      y: -50,
      vx: (Math.random() - 0.5) * 3,
      collected: false
    };

    setFallingMetals(prev => [...prev, newMetal]);
  }, [mounted, currentChallenge]);

  const checkCorrectMetal = (metal: Metal): boolean => {
    if (!currentChallenge) return false;

    switch (currentChallenge.type) {
      case 'reactivity':
        return metal.reactivity === currentChallenge.correctAnswer;
      case 'property':
        return metal.properties.includes(currentChallenge.correctAnswer);
      case 'use':
        return metal.name === currentChallenge.correctAnswer;
      case 'symbol':
        return metal.symbol === currentChallenge.correctAnswer;
      default:
        return false;
    }
  };

  const updateGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameOver || !gameStarted || !currentChallenge) return;

    const basketWidth = 100;
    const basketHeight = 60;

    setFallingMetals(prev => {
      const updated = prev.map(fallingMetal => {
        if (fallingMetal.collected) {
          return fallingMetal;
        }

        const newY = fallingMetal.y + 2.5;
        const newX = fallingMetal.x + fallingMetal.vx;

        // Bounce off walls
        let newVx = fallingMetal.vx;
        if (newX < 30 || newX > canvas.width - 30) {
          newVx = -fallingMetal.vx;
        }

        // Check collection with basket
        const metalSize = 40;
        const basketTop = canvas.height - basketHeight - 20;
        
        if (
          newY + metalSize > basketTop &&
          newY < canvas.height - 20 &&
          newX > basketX - basketWidth / 2 &&
          newX < basketX + basketWidth / 2
        ) {
          // Collected!
          const isCorrect = checkCorrectMetal(fallingMetal.metal);
          
          if (isCorrect) {
            setScore(s => s + 10);
            setCombo(c => c + 1);
          } else {
            setLives(l => l - 1);
            setCombo(0);
          }

          return {
            ...fallingMetal,
            collected: true,
            collectedTime: Date.now()
          };
        }

        // Remove if fallen off screen (lose life only if it was correct)
        if (newY > canvas.height + 50) {
          if (checkCorrectMetal(fallingMetal.metal)) {
            setLives(l => l - 1);
            setCombo(0);
          }
        }

        return {
          ...fallingMetal,
          x: newX,
          y: newY,
          vx: newVx
        };
      });

      // Remove collected metals after animation and fallen metals
      return updated.filter(m => {
        if (m.collected && m.collectedTime && Date.now() - m.collectedTime > 500) {
          return false;
        }
        if (m.y > canvas.height + 100) {
          return false;
        }
        return true;
      });
    });

    // Update challenge timer
    setChallengeTimer(prev => prev + 1);

    // Spawn new metals
    const now = Date.now();
    if (now - lastSpawnRef.current > 1500) {
      spawnMetal();
      lastSpawnRef.current = now;
    }

    // New challenge every 15 seconds
    if (challengeTimer > 0 && challengeTimer % 900 === 0) {
      setCurrentChallenge(generateChallenge());
      setChallengeTimer(0);
    }
  }, [gameOver, gameStarted, basketX, currentChallenge, spawnMetal, generateChallenge, challengeTimer]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient (horizontal emphasis)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#fef3c7');
    gradient.addColorStop(0.5, '#fde68a');
    gradient.addColorStop(1, '#fcd34d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative elements
    ctx.save();
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 5; i++) {
      const x = (i + 1) * (canvas.width / 6);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, 100 + Math.sin(Date.now() * 0.001 + i) * 20, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw falling metals
    fallingMetals.forEach(fallingMetal => {
      ctx.save();

      if (fallingMetal.collected) {
        ctx.globalAlpha = Math.max(0, 1 - (Date.now() - (fallingMetal.collectedTime || 0)) / 500);
      }

      const metalSize = 40;

      // Metal circle with glow
      const isCorrect = checkCorrectMetal(fallingMetal.metal);
      
      // Glow effect
      ctx.shadowColor = isCorrect ? '#22c55e' : '#ef4444';
      ctx.shadowBlur = 15;
      
      ctx.fillStyle = fallingMetal.metal.color;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fallingMetal.x, fallingMetal.y, metalSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Metal emoji
      ctx.font = `${metalSize * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fallingMetal.metal.emoji, fallingMetal.x, fallingMetal.y - 2);

      // Symbol below
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(fallingMetal.metal.symbol, fallingMetal.x, fallingMetal.y + metalSize / 2 + 12);

      ctx.restore();
    });

    // Draw basket
    const basketWidth = 100;
    const basketHeight = 60;
    const basketY = canvas.height - basketHeight - 20;

    // Basket shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    // Basket body
    const basketGradient = ctx.createLinearGradient(
      basketX - basketWidth / 2,
      basketY,
      basketX + basketWidth / 2,
      basketY
    );
    basketGradient.addColorStop(0, '#8b4513');
    basketGradient.addColorStop(0.5, '#a0522d');
    basketGradient.addColorStop(1, '#8b4513');
    
    ctx.fillStyle = basketGradient;
    ctx.beginPath();
    ctx.moveTo(basketX - basketWidth / 2, basketY);
    ctx.lineTo(basketX - basketWidth / 2 + 10, basketY + basketHeight);
    ctx.lineTo(basketX + basketWidth / 2 - 10, basketY + basketHeight);
    ctx.lineTo(basketX + basketWidth / 2, basketY);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Basket icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🧺', basketX, basketY + basketHeight / 2 + 5);

    // Draw challenge timer bar
    if (currentChallenge) {
      const progress = (challengeTimer % 900) / 900;
      const barWidth = canvas.width - 40;
      const barHeight = 8;
      const barX = 20;
      const barY = canvas.height - 10;

      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const timerGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
      timerGradient.addColorStop(0, '#3b82f6');
      timerGradient.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = timerGradient;
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    }
  }, [fallingMetals, basketX, currentChallenge, challengeTimer]);

  useEffect(() => {
    if (mounted && gameStarted) {
      const loop = () => {
        updateGame();
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
  }, [mounted, gameStarted, updateGame, draw]);

  useEffect(() => {
    if (lives <= 0 && gameStarted) {
      setGameOver(true);
      setGameStarted(false);
    }
  }, [lives, gameStarted]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setCombo(0);
    setFallingMetals([]);
    setChallengeTimer(0);
    setCurrentChallenge(generateChallenge());
    lastSpawnRef.current = Date.now();
    setBasketX(canvasSize.width / 2);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setCombo(0);
    setFallingMetals([]);
    setChallengeTimer(0);
    setCurrentChallenge(null);
    setBasketX(canvasSize.width / 2);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    
    setBasketX(Math.max(60, Math.min(x, canvas.width - 60)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!gameStarted) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    
    setBasketX(Math.max(60, Math.min(x, canvas.width - 60)));
  };

  return (
    <div className="h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-amber-300 to-yellow-400 rounded-full blur-3xl"></div>
      </div>

      {!gameStarted && (
        <div className="text-center mb-3 sm:mb-6 relative z-10">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-orange-600 to-amber-700 mb-2 sm:mb-3 drop-shadow-lg">
            ⚗️ Metal Mayhem
          </h1>
          <p className="text-slate-700 text-xs sm:text-lg font-semibold px-4 bg-white/50 backdrop-blur-sm rounded-full py-2 border border-amber-300 shadow-lg">
            Catch the right metals and learn chemistry!
          </p>
        </div>
      )}

      {!gameStarted && !gameOver && !showInstructions && (
        <div className="text-center mb-4 sm:mb-6 relative z-10">
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-600 hover:via-amber-600 hover:to-orange-600 text-white font-bold py-4 sm:py-5 px-12 sm:px-20 rounded-2xl transition-all duration-300 text-lg sm:text-xl shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start Game
          </button>
        </div>
      )}

      {gameStarted && currentChallenge && (
        <div className="w-full max-w-4xl mb-2 sm:mb-4 relative z-10 px-2">
          <div className="bg-gradient-to-r from-white to-amber-50 backdrop-blur-sm rounded-xl px-3 sm:px-6 py-2 sm:py-4 shadow-lg border-2 border-amber-300 mb-2">
            <div className="text-slate-600 font-semibold text-[10px] sm:text-sm uppercase tracking-wider mb-1">
              Challenge:
            </div>
            <div className="text-sm sm:text-2xl font-black text-amber-700">
              {currentChallenge.question}
            </div>
          </div>

          <div className="flex justify-between items-center gap-1 sm:gap-3">
            <div className="bg-gradient-to-br from-white to-blue-50 backdrop-blur-sm rounded-xl px-2 sm:px-4 py-1 sm:py-2 shadow-lg border border-blue-200 flex-1">
              <div className="text-slate-600 font-semibold text-[10px] sm:text-xs uppercase tracking-wider">Score</div>
              <div className="text-base sm:text-2xl font-black text-blue-600">{score}</div>
            </div>

            <div className="bg-gradient-to-br from-white to-red-50 backdrop-blur-sm rounded-xl px-2 sm:px-4 py-1 sm:py-2 shadow-lg border border-red-200 flex-1">
              <div className="text-slate-600 font-semibold text-[10px] sm:text-xs uppercase tracking-wider">Lives</div>
              <div className="text-base sm:text-2xl font-black text-red-500">{lives}</div>
            </div>

            <div className="bg-gradient-to-br from-white to-purple-50 backdrop-blur-sm rounded-xl px-2 sm:px-4 py-1 sm:py-2 shadow-lg border border-purple-200 flex-1">
              <div className="text-slate-600 font-semibold text-[10px] sm:text-xs uppercase tracking-wider">Combo</div>
              <div className="text-base sm:text-2xl font-black text-purple-600">{combo}x</div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border-4 border-white/30 rounded-3xl shadow-2xl bg-white max-w-full cursor-none"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          style={{ touchAction: 'none' }}
        />
      </div>

      {gameStarted && (
        <div className="mt-3 text-center relative z-10">
          <p className="text-slate-600 text-sm bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-200">
            Move your mouse/finger to control the basket 🧺
          </p>
        </div>
      )}

      {gameStarted && !gameOver && (
        <Link
          href="https://eklavyaa.vercel.app/chapters/class-8/science-wonder"
          className="mt-4 text-slate-600 hover:text-orange-600 transition-all duration-300 font-semibold relative z-10 text-sm sm:text-base bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-200 hover:border-orange-400 hover:shadow-lg transform hover:scale-105"
        >
          ← Back to Science Games
        </Link>
      )}

      {gameOver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-10 text-center shadow-2xl max-w-md mx-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Game Over!</h2>
            <div className="mb-6">
              <p className="text-xl sm:text-2xl font-semibold text-amber-600 mb-2">Final Score: {score}</p>
              <p className="text-lg text-slate-600">Best Combo: {combo}x</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 mb-6 border-2 border-amber-200">
              <h3 className="font-bold text-slate-800 mb-2">🎓 Did You Know?</h3>
              <p className="text-sm text-slate-700">
                {metals[Math.floor(Math.random() * metals.length)].funFact}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={resetGame}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                🔄 Play Again
              </button>
              <Link
                href="https://eklavyaa.vercel.app/chapters/class-8/science-wonder"
                className="block w-full bg-slate-500 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                ← Back to Science Games
              </Link>
            </div>
          </div>
        </div>
      )}

      {!gameStarted && !gameOver && !showInstructions && (
        <Link
          href="https://eklavyaa.vercel.app/chapters/class-8/science-wonder"
          className="mt-4 sm:mt-6 text-slate-600 hover:text-orange-600 transition-all duration-300 font-semibold relative z-10 text-sm sm:text-base bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-200 hover:border-orange-400 hover:shadow-lg transform hover:scale-105"
        >
          ← Back to Science Games
        </Link>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-amber-50 to-yellow-50 rounded-3xl p-6 sm:p-10 text-center max-w-3xl shadow-2xl border-4 border-white/30 max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 mb-3">
              Metal Mayhem
            </h2>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-6">
              Master the Metals!
            </h3>
            
            <div className="bg-white rounded-2xl p-6 mb-6 border border-amber-200 text-left">
              <h4 className="font-bold text-lg text-slate-800 mb-3">🎯 How to Play:</h4>
              <div className="space-y-2 text-slate-700">
                <p className="flex items-start">
                  <span className="text-amber-500 font-bold mr-3">•</span>
                  <span>Move your mouse/finger to control the basket</span>
                </p>
                <p className="flex items-start">
                  <span className="text-orange-500 font-bold mr-3">•</span>
                  <span>Read the challenge and catch the correct metals</span>
                </p>
                <p className="flex items-start">
                  <span className="text-amber-500 font-bold mr-3">•</span>
                  <span>Correct metals give +10 points and increase combo</span>
                </p>
                <p className="flex items-start">
                  <span className="text-orange-500 font-bold mr-3">•</span>
                  <span>Wrong metals or missing correct ones costs 1 life</span>
                </p>
                <p className="flex items-start">
                  <span className="text-amber-500 font-bold mr-3">•</span>
                  <span>Challenges change every 15 seconds</span>
                </p>
                <p className="flex items-start">
                  <span className="text-orange-500 font-bold mr-3">•</span>
                  <span>You have 3 lives - survive as long as you can!</span>
                </p>
              </div>
            </div>


            <button
              onClick={() => setShowInstructions(false)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-4 px-12 rounded-2xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Learning! ⚗️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
