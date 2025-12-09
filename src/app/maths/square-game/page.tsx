'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

interface Number {
  id: string;
  value: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isSliced: boolean;
  isPerfectSquare: boolean;
  sliceTime?: number;
}

interface SliceEffect {
  id: string;
  x: number;
  y: number;
  timestamp: number;
}

export default function SquareGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numbers, setNumbers] = useState<Number[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [sliceEffects, setSliceEffects] = useState<SliceEffect[]>([]);
  const [combo, setCombo] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mouseTrail, setMouseTrail] = useState<{ x: number, y: number }[]>([]);
  const [mounted, setMounted] = useState(false);
  const [lastSliceTime, setLastSliceTime] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const gameLoopRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const randomSeedRef = useRef<number>(0);
  // Perfect squares up to 400 (20^2)

  const perfectSquares = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400];

  // Simple seeded random function to avoid hydration issues
  const seededRandom = useCallback(() => {
    randomSeedRef.current = (randomSeedRef.current * 9301 + 49297) % 233280;
    return randomSeedRef.current / 233280;
  }, []);

  const generateRandomNumber = useCallback((): number => {
    if (!mounted) return 4; // Default value during SSR

    // 60% chance of perfect square, 40% chance of random number
    if (seededRandom() < 0.6) {
      return perfectSquares[Math.floor(seededRandom() * perfectSquares.length)];
    } else {
      // Generate non-perfect square
      let num;
      do {
        num = Math.floor(seededRandom() * 100) + 1;
      } while (perfectSquares.includes(num));
      return num;
    }
  }, [mounted, seededRandom]);

  const spawnNumbers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mounted) return;

    // Sometimes spawn 2-3 numbers together (30% chance)
    const numToSpawn = seededRandom() < 0.3 ? Math.floor(seededRandom() * 2) + 2 : 1;

    for (let i = 0; i < numToSpawn; i++) {
      const value = generateRandomNumber();
      const baseX = seededRandom() * (canvas.width - 120) + 60;
      const isMobile = canvas.width < 500;
      const newNumber: Number = {
        id: `${Date.now()}-${seededRandom()}-${i}`,
        value,
        x: baseX + (i * (seededRandom() * (isMobile ? 60 : 100) - (isMobile ? 30 : 50))), // Adjusted spread for mobile
        y: canvas.height + 50,
        vx: (seededRandom() - 0.5) * (isMobile ? 1.5 : 2), // Slower on mobile
        vy: -(seededRandom() * (isMobile ? 6 : 8) + (isMobile ? 10 : 14)), // Adjusted for mobile screen
        isSliced: false,
        isPerfectSquare: perfectSquares.includes(value)
      };

      setNumbers(prev => [...prev, newNumber]);
    }
  }, [generateRandomNumber, mounted, seededRandom]);

  const checkCollision = (mouseX: number, mouseY: number, number: Number): boolean => {
    const canvas = canvasRef.current;
    const isMobile = canvas && canvas.width < 500;
    const hitRadius = isMobile ? 50 : 40; // Larger hit area on mobile
    const distance = Math.sqrt((mouseX - number.x) ** 2 + (mouseY - number.y) ** 2);
    return distance < hitRadius;
  };

  const handleSlice = useCallback((mouseX: number, mouseY: number) => {
    const now = Date.now();
    // Prevent multiple slices within 100ms
    if (now - lastSliceTime < 100) return;

    // Find the first unsliced number that collides
    const targetNumber = numbers.find(number =>
      !number.isSliced && checkCollision(mouseX, mouseY, number)
    );

    if (!targetNumber) return;

    setLastSliceTime(now);

    // Add slice effect
    setSliceEffects(effects => [...effects, {
      id: `slice-${now}`,
      x: targetNumber.x,
      y: targetNumber.y,
      timestamp: now
    }]);

    // Mark number as sliced
    setNumbers(prev => prev.map(number =>
      number.id === targetNumber.id
        ? { ...number, isSliced: true, sliceTime: now }
        : number
    ));

    // Handle scoring and lives
    if (targetNumber.isPerfectSquare) {
      // Correct slice
      setScore(prev => prev + 1);
      setCombo(prev => prev + 1);
    } else {
      // Wrong slice
      setLives(prev => prev - 1);
      setCombo(0);
    }
  }, [numbers, lastSliceTime]);



  const updateGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameOver || !gameStarted) return;

    setNumbers(prev => {
      const updated = prev.map(number => {
        // Apply different physics based on position and velocity
        let newVx = number.vx;
        let newVy = number.vy;

        // Slow down horizontal movement in the middle zone for better clicking
        if (number.y > 100 && number.y < 500) {
          newVx = number.vx * 0.98; // Gradual horizontal slowdown
        }

        // Apply gravity - stronger when going up, weaker when coming down
        if (number.vy < 0) {
          // Going up - normal gravity
          newVy = number.vy + 0.4;
        } else {
          // Coming down - reduced gravity for slower descent
          newVy = number.vy + 0.15;
        }

        return {
          ...number,
          x: number.x + newVx,
          y: number.y + newVy,
          vx: newVx,
          vy: newVy
        };
      }).filter(number => {
        // Remove numbers that went too high (keep within playable area)
        if (number.y < -50) {
          return false;
        }
        // Remove numbers that fell off screen (no life deduction)
        if (number.y > canvas.height + 100) {
          return false;
        }
        // Remove sliced numbers after animation
        if (number.isSliced && number.sliceTime && Date.now() - number.sliceTime > 1000) {
          return false;
        }
        return true;
      });

      return updated;
    });

    // Clean up old slice effects
    setSliceEffects(effects =>
      effects.filter(effect => Date.now() - effect.timestamp < 500)
    );

    // Spawn new numbers (slower spawn rate)
    const now = Date.now();
    if (now - lastSpawnRef.current > 2500) {
      spawnNumbers();
      lastSpawnRef.current = now;
    }
  }, [gameOver, gameStarted, spawnNumbers]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dynamic background with animated elements
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(0.3, '#e0f2fe');
    gradient.addColorStop(0.7, '#ddd6fe');
    gradient.addColorStop(1, '#e0e7ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle animated background pattern
    const time = Date.now() * 0.001;
    for (let i = 0; i < 5; i++) {
      const x = (Math.sin(time + i) * 50) + canvas.width * (0.2 + i * 0.15);
      const y = (Math.cos(time + i * 0.7) * 30) + canvas.height * (0.3 + i * 0.1);
      const radius = 20 + Math.sin(time + i * 2) * 10;

      ctx.save();
      ctx.globalAlpha = 0.05;
      const bgGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      bgGradient.addColorStop(0, '#3b82f6');
      bgGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw enhanced mouse trail with gradient
    if (mouseTrail.length > 1) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Create gradient trail
      mouseTrail.forEach((point, index) => {
        if (index > 0) {
          const prevPoint = mouseTrail[index - 1];
          const alpha = (index / mouseTrail.length) * 0.8;
          const width = (index / mouseTrail.length) * 8 + 2;

          // Outer glow
          ctx.save();
          ctx.globalAlpha = alpha * 0.3;
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = width + 4;
          ctx.shadowColor = '#3b82f6';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.moveTo(prevPoint.x, prevPoint.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
          ctx.restore();

          // Inner trail
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = width;
          ctx.shadowColor = '#60a5fa';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(prevPoint.x, prevPoint.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
          ctx.restore();
        }
      });
    }

    // Draw numbers
    numbers.forEach(number => {
      ctx.save();

      if (number.isSliced) {
        ctx.globalAlpha = Math.max(0, 1 - (Date.now() - (number.sliceTime || 0)) / 1000);
        ctx.translate(number.x, number.y);
        ctx.rotate(seededRandom() * 0.5);
      }

      // Draw simple number circle
      const radius = 35;

      // Simple shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;

      // Simple gradient
      const numberGradient = ctx.createRadialGradient(number.x, number.y, 0, number.x, number.y, radius);
      numberGradient.addColorStop(0, '#f8fafc');
      numberGradient.addColorStop(1, '#e2e8f0');

      ctx.beginPath();
      ctx.arc(number.x, number.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = numberGradient;
      ctx.fill();

      // Simple border
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw enhanced number text with multiple layers
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Simple number text
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(number.value.toString(), number.x, number.y);

      ctx.restore();
    });

    // Draw slice effects
    sliceEffects.forEach(effect => {
      const age = Date.now() - effect.timestamp;
      const alpha = Math.max(0, 1 - age / 500);

      ctx.save();
      ctx.globalAlpha = alpha;

      // Simple slash effect
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(effect.x - 30, effect.y - 30);
      ctx.lineTo(effect.x + 30, effect.y + 30);
      ctx.stroke();

      ctx.restore();
    });
  }, [numbers, sliceEffects, mouseTrail]);

  // Handle client-side mounting and responsive canvas
  useEffect(() => {
    setMounted(true);
    randomSeedRef.current = Date.now() % 233280;

    const updateCanvasSize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth < 1024;

      if (isMobile) {
        setCanvasSize({
          width: Math.min(window.innerWidth - 32, 400),
          height: Math.min(window.innerHeight - 200, 500)
        });
      } else if (isTablet) {
        setCanvasSize({ width: 600, height: 500 });
      } else {
        setCanvasSize({ width: 800, height: 600 });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameStarted && !gameOver && mounted) {
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
  }, [gameStarted, gameOver, updateGame, draw, mounted]);

  // Check game over
  useEffect(() => {
    console.log(`Lives changed: ${lives}`);
    if (lives <= 0 && gameStarted) {
      console.log('Game Over triggered!');
      setGameOver(true);
      setGameStarted(false);
    }
  }, [lives, gameStarted]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setNumbers([]);
    setCombo(0);
    setSliceEffects([]);
    setLastSliceTime(0);
    randomSeedRef.current = Date.now() % 233280;
    lastSpawnRef.current = Date.now();
  };

  const closeInstructions = () => {
    setShowInstructions(false);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setNumbers([]);
    setCombo(0);
    setSliceEffects([]);
    setLastSliceTime(0);
    randomSeedRef.current = Date.now() % 233280;
  };

  // Mouse/touch handlers
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsMouseDown(true);
    setMouseTrail([]);
  };

  const getEventCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!gameStarted) return;

    const { x, y } = getEventCoordinates(e);

    if (isMouseDown) {
      setMouseTrail(trail => [...trail.slice(-5), { x, y }]);
      // Only slice if moved significantly
      const lastPoint = mouseTrail[mouseTrail.length - 1];
      if (!lastPoint || Math.abs(x - lastPoint.x) > 3 || Math.abs(y - lastPoint.y) > 3) {
        handleSlice(x, y);
      }
    }
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsMouseDown(false);
    setMouseTrail([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-5 sm:top-10 left-5 sm:left-10 w-32 sm:w-64 h-32 sm:h-64 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-10 sm:right-20 w-24 sm:w-48 h-24 sm:h-48 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 sm:bottom-20 left-1/4 w-40 sm:w-80 h-40 sm:h-80 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-full blur-3xl"></div>
      </div>

      <div className="text-center mb-3 sm:mb-6 relative z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-2 sm:mb-3 drop-shadow-lg">
          Square Ninja
        </h1>
        <p className="text-slate-600 text-sm sm:text-lg font-semibold px-4 bg-white/50 backdrop-blur-sm rounded-full py-2 border border-blue-200 shadow-lg">
          Slice only the perfect squares for points!
        </p>
      </div>

      {!gameStarted && !gameOver && !showInstructions && (
        <div className="text-center mb-4 sm:mb-6 relative z-10">
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white font-bold py-4 sm:py-5 px-12 sm:px-20 rounded-2xl transition-all duration-300 text-lg sm:text-xl shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start Game
          </button>
        </div>
      )}

      {gameStarted && (
        <div className="flex justify-between items-center w-full max-w-4xl mb-3 sm:mb-6 relative z-10 px-2 gap-3">
          {/* Score Card */}
          <div className="bg-gradient-to-br from-white to-blue-50 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg border border-blue-200 flex-1">
            <div className="text-slate-600 font-semibold text-xs sm:text-sm uppercase tracking-wider">Score</div>
            <div className="text-xl sm:text-3xl font-black text-blue-600">{score}</div>
          </div>

          {/* Lives Card */}
          <div className="bg-gradient-to-br from-white to-red-50 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg border border-red-200 flex-1">
            <div className="text-slate-600 font-semibold text-xs sm:text-sm uppercase tracking-wider">Lives</div>
            <div className="text-xl sm:text-3xl font-black text-red-500">{lives}</div>
          </div>

          {/* Combo Card */}
          <div className="bg-gradient-to-br from-white to-purple-50 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg border border-purple-200 flex-1">
            <div className="text-slate-600 font-semibold text-xs sm:text-sm uppercase tracking-wider">Combo</div>
            <div className="text-xl sm:text-3xl font-black text-purple-600">{combo}x</div>
          </div>
        </div>
      )}

      <div className="relative z-10">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="border-4 border-white/30 rounded-3xl cursor-crosshair shadow-2xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 max-w-full backdrop-blur-sm"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            style={{ touchAction: 'none' }}
          />
          {/* Canvas glow effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-xl -z-10"></div>


        </div>
      </div>

      {gameStarted && !gameOver && (
        <Link
          href="https://eklavyaa.vercel.app/chapters/class-8/maths-wonder"
          className="mt-4 text-slate-600 hover:text-blue-600 transition-all duration-300 font-semibold relative z-10 text-sm sm:text-base bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200 hover:border-blue-400 hover:shadow-lg transform hover:scale-105"
        >
          ← Back to Math Games
        </Link>
      )}

      {gameOver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 text-center shadow-xl max-w-sm mx-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">Game Over!</h2>
            <div className="mb-6">
              <p className="text-lg sm:text-xl font-semibold text-slate-700 mb-1">Final Score: {score}</p>
              <p className="text-base text-slate-600">Best Combo: {combo}x</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={resetGame}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Play Again
              </button>
              <Link
                href="https://eklavyaa.vercel.app/chapters/class-8/maths-wonder"
                className="block w-full bg-slate-500 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Back to Math Games
              </Link>
            </div>
          </div>
        </div>
      )}

      {!gameStarted && !gameOver && !showInstructions && (
        <Link
          href="https://eklavyaa.vercel.app/chapters/class-8/maths-wonder"
          className="mt-4 sm:mt-6 text-slate-600 hover:text-blue-600 transition-all duration-300 font-semibold relative z-10 text-sm sm:text-base bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200 hover:border-blue-400 hover:shadow-lg transform hover:scale-105"
        >
          ← Back to Math Games
        </Link>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 rounded-3xl p-6 sm:p-10 text-center max-w-sm sm:max-w-2xl mx-4 shadow-2xl border-4 border-white/30 backdrop-blur-lg relative overflow-hidden">
            <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2 sm:mb-3">Square Ninja</h2>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-6 sm:mb-8">How to Play</h3>
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-blue-200">
              <div className="text-slate-700 space-y-3 sm:space-y-4 text-left text-sm sm:text-base">
                <p className="flex items-start"><span className="text-blue-500 font-bold mr-3">•</span><span><strong>All numbers look the same</strong> - you decide which to slice!</span></p>
                <p className="flex items-start"><span className="text-indigo-500 font-bold mr-3">•</span><span><strong>Perfect squares</strong> (1, 4, 9, 16, 25, 36, 49, 64, 81, 100...) give you points</span></p>
                <p className="flex items-start"><span className="text-purple-500 font-bold mr-3">•</span><span><strong>Slicing non-perfect squares</strong> loses you a life</span></p>
                <p className="flex items-start"><span className="text-cyan-500 font-bold mr-3">•</span><span><strong>Build combos</strong> by slicing consecutive perfect squares</span></p>
                <p className="flex items-start"><span className="text-blue-500 font-bold mr-3">•</span><span><strong>Missing numbers is okay</strong> - only wrong slices cost lives!</span></p>
                <p className="flex items-start"><span className="text-indigo-500 font-bold mr-3">•</span><span><strong>You have 3 lives</strong> - make them count!</span></p>
              </div>
            </div>
            <button
              onClick={closeInstructions}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 px-12 rounded-2xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Move to Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}