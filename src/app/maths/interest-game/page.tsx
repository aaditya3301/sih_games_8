'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

interface Scenario {
  id: number;
  title: string;
  description: string;
  principal: number;
  rate: number;
  time: number;
  type: 'simple' | 'compound';
  emoji: string;
  context: string;
}

interface Coin {
  id: string;
  x: number;
  y: number;
  vy: number;
  vx: number;
  value: number;
}

export default function InterestCalc() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ show: boolean; correct: boolean; message: string }>({
    show: false,
    correct: false,
    message: ''
  });
  const [coins, setCoins] = useState<Coin[]>([]);
  const [showFormula, setShowFormula] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [lives, setLives] = useState(3);
  const [mounted, setMounted] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

  const gameLoopRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const scenarios: Scenario[] = [
    {
      id: 1,
      title: 'Savings Account',
      description: 'Calculate the simple interest',
      principal: 1000,
      rate: 5,
      time: 2,
      type: 'simple',
      emoji: '🏦',
      context: 'You deposit ₹1000 in a bank at 5% annual interest for 2 years.'
    },
    {
      id: 2,
      title: 'Fixed Deposit',
      description: 'Find the compound interest',
      principal: 5000,
      rate: 8,
      time: 3,
      type: 'compound',
      emoji: '💰',
      context: 'Your parents invest ₹5000 in FD at 8% annual compound interest for 3 years.'
    },
    {
      id: 3,
      title: 'Loan Interest',
      description: 'Calculate the simple interest',
      principal: 2000,
      rate: 10,
      time: 1,
      type: 'simple',
      emoji: '🏪',
      context: 'A shop owner takes a ₹2000 loan at 10% simple interest for 1 year.'
    },
    {
      id: 4,
      title: 'Investment Fund',
      description: 'Find the compound interest',
      principal: 10000,
      rate: 6,
      time: 2,
      type: 'compound',
      emoji: '📈',
      context: 'An investment of ₹10000 grows at 6% compound interest annually for 2 years.'
    },
    {
      id: 5,
      title: 'Education Savings',
      description: 'Calculate the simple interest',
      principal: 15000,
      rate: 4,
      time: 3,
      type: 'simple',
      emoji: '🎓',
      context: 'Saving ₹15000 for education at 4% simple interest for 3 years.'
    },
    {
      id: 6,
      title: 'Business Growth',
      description: 'Find the compound interest',
      principal: 8000,
      rate: 12,
      time: 2,
      type: 'compound',
      emoji: '🏢',
      context: 'Business investment of ₹8000 at 12% compound interest for 2 years.'
    },
    {
      id: 7,
      title: 'Piggy Bank',
      description: 'Calculate the simple interest',
      principal: 500,
      rate: 6,
      time: 4,
      type: 'simple',
      emoji: '🐷',
      context: 'Your piggy bank money ₹500 earning 6% simple interest over 4 years.'
    },
    {
      id: 8,
      title: 'Mutual Fund',
      description: 'Find the compound interest',
      principal: 20000,
      rate: 10,
      time: 3,
      type: 'compound',
      emoji: '💼',
      context: 'Mutual fund investment of ₹20000 at 10% compound interest for 3 years.'
    }
  ];

  const calculateCorrectAnswer = (scenario: Scenario): number => {
    const { principal, rate, time, type } = scenario;
    
    if (type === 'simple') {
      // Simple Interest = (P × R × T) / 100
      return (principal * rate * time) / 100;
    } else {
      // Compound Interest = P(1 + R/100)^T - P
      const amount = principal * Math.pow(1 + rate / 100, time);
      return Math.round(amount - principal);
    }
  };

  const spawnCoins = useCallback((amount: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newCoins: Coin[] = [];
    const numCoins = Math.min(Math.floor(amount / 10), 50); // Max 50 coins

    for (let i = 0; i < numCoins; i++) {
      newCoins.push({
        id: `coin-${Date.now()}-${i}`,
        x: Math.random() * (canvas.width - 40) + 20,
        y: -20 - i * 10,
        vy: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 4,
        value: 10
      });
    }

    setCoins(prev => [...prev, ...newCoins]);
  }, []);

  const getRandomScenario = useCallback((): Scenario => {
    const availableScenarios = scenarios.filter(s => 
      s.id <= Math.min(level + 2, scenarios.length)
    );
    return availableScenarios[Math.floor(Math.random() * availableScenarios.length)];
  }, [level]);

  useEffect(() => {
    setMounted(true);

    const updateCanvasSize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth < 1024;

      if (isMobile) {
        setCanvasSize({
          width: Math.min(window.innerWidth - 32, 400),
          height: 300
        });
      } else if (isTablet) {
        setCanvasSize({ width: 500, height: 350 });
      } else {
        setCanvasSize({ width: 600, height: 400 });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const updateCoins = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setCoins(prev => {
      return prev.map(coin => {
        let newVy = coin.vy + 0.3; // Gravity
        let newVx = coin.vx;
        let newY = coin.y + newVy;
        let newX = coin.x + newVx;

        // Bounce off walls
        if (newX < 20 || newX > canvas.width - 20) {
          newVx = -newVx * 0.8;
          newX = Math.max(20, Math.min(newX, canvas.width - 20));
        }

        // Bounce off floor
        if (newY > canvas.height - 20) {
          newVy = -newVy * 0.7;
          newY = canvas.height - 20;
          if (Math.abs(newVy) < 0.5) {
            newVy = 0;
          }
        }

        return {
          ...coin,
          x: newX,
          y: newY,
          vx: newVx * 0.99, // Friction
          vy: newVy
        };
      }).filter(coin => 
        // Remove coins that have settled
        !(coin.y >= canvas.height - 25 && Math.abs(coin.vy) < 0.1)
      );
    });
  }, []);

  const drawCoins = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#fef3c7');
    gradient.addColorStop(1, '#fde68a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw floor
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

    // Draw coins
    coins.forEach(coin => {
      ctx.save();

      // Coin shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 3;

      // Coin gradient
      const coinGradient = ctx.createRadialGradient(
        coin.x - 5, coin.y - 5, 2,
        coin.x, coin.y, 15
      );
      coinGradient.addColorStop(0, '#fbbf24');
      coinGradient.addColorStop(0.5, '#f59e0b');
      coinGradient.addColorStop(1, '#d97706');

      ctx.fillStyle = coinGradient;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Coin symbol
      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₹', coin.x, coin.y);

      ctx.restore();
    });

    // Draw decorative money bag if coins settled
    if (coins.length > 0 && coins.every(c => c.y >= canvas.height - 25)) {
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('💰', canvas.width / 2, canvas.height / 2);
    }
  }, [coins]);

  useEffect(() => {
    if (mounted && (coins.length > 0 || gameStarted)) {
      const loop = () => {
        updateCoins();
        drawCoins();
        gameLoopRef.current = requestAnimationFrame(loop);
      };
      gameLoopRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [mounted, coins, gameStarted, updateCoins, drawCoins]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !feedback.show) {
      timerRef.current = window.setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && !feedback.show) {
      // Time's up
      setLives(l => l - 1);
      setFeedback({
        show: true,
        correct: false,
        message: `Time's up! The correct answer was ₹${calculateCorrectAnswer(currentScenario!)}`
      });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [gameStarted, timeLeft, feedback.show, currentScenario]);

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
    setLevel(1);
    setLives(3);
    setCoins([]);
    loadNewScenario();
  };

  const loadNewScenario = () => {
    const scenario = getRandomScenario();
    setCurrentScenario(scenario);
    setUserAnswer('');
    setFeedback({ show: false, correct: false, message: '' });
    setShowFormula(false);
    setTimeLeft(30);
    setCoins([]);
  };

  const checkAnswer = () => {
    if (!currentScenario || userAnswer === '') return;

    const correctAnswer = calculateCorrectAnswer(currentScenario);
    const userAnswerNum = parseFloat(userAnswer);
    const isCorrect = Math.abs(userAnswerNum - correctAnswer) < 1;

    if (isCorrect) {
      const points = Math.floor(timeLeft * 2); // More time left = more points
      setScore(s => s + points);
      spawnCoins(correctAnswer);
      setFeedback({
        show: true,
        correct: true,
        message: `Correct! 🎉 You earned ${points} points! Interest = ₹${correctAnswer}`
      });
      
      // Level up every 3 correct answers
      if ((score + points) % 150 >= 0 && level < 8) {
        setLevel(l => l + 1);
      }
    } else {
      setLives(l => l - 1);
      setFeedback({
        show: true,
        correct: false,
        message: `Wrong! The correct answer was ₹${correctAnswer}`
      });
    }
  };

  const nextQuestion = () => {
    loadNewScenario();
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setLives(3);
    setCurrentScenario(null);
    setUserAnswer('');
    setCoins([]);
    setFeedback({ show: false, correct: false, message: '' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !feedback.show) {
      checkAnswer();
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-orange-300 to-yellow-400 rounded-full blur-3xl"></div>
      </div>

      {!gameStarted && (
        <div className="text-center mb-3 sm:mb-6 relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 mb-2 sm:mb-3 drop-shadow-lg">
            💰 Interest Calc
          </h1>
          <p className="text-slate-700 text-sm sm:text-lg font-semibold px-4 bg-white/50 backdrop-blur-sm rounded-full py-2 border border-amber-300 shadow-lg">
            Master Simple & Compound Interest!
          </p>
        </div>
      )}

      {!gameStarted && !gameOver && !showInstructions && (
        <div className="text-center mb-4 sm:mb-6 relative z-10">
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 text-white font-bold py-4 sm:py-5 px-12 sm:px-20 rounded-2xl transition-all duration-300 text-lg sm:text-xl shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start Game
          </button>
        </div>
      )}

      {gameStarted && currentScenario && (
        <div className="w-full max-w-4xl relative z-10 px-2 space-y-2 overflow-y-auto max-h-screen">
          {/* Stats Bar */}
          <div className="flex justify-between items-center gap-1 sm:gap-3">
            <div className="bg-gradient-to-br from-white to-blue-50 backdrop-blur-sm rounded-xl px-2 sm:px-4 py-1 sm:py-2 shadow-lg border border-blue-200 flex-1">
              <div className="text-slate-600 font-semibold text-[10px] sm:text-xs uppercase tracking-wider">Score</div>
              <div className="text-base sm:text-2xl font-black text-blue-600">{score}</div>
            </div>

            <div className="bg-gradient-to-br from-white to-purple-50 backdrop-blur-sm rounded-xl px-2 sm:px-4 py-1 sm:py-2 shadow-lg border border-purple-200 flex-1">
              <div className="text-slate-600 font-semibold text-[10px] sm:text-xs uppercase tracking-wider">Level</div>
              <div className="text-base sm:text-2xl font-black text-purple-600">{level}</div>
            </div>

            <div className="bg-gradient-to-br from-white to-red-50 backdrop-blur-sm rounded-xl px-2 sm:px-4 py-1 sm:py-2 shadow-lg border border-red-200 flex-1">
              <div className="text-slate-600 font-semibold text-[10px] sm:text-xs uppercase tracking-wider">Lives</div>
              <div className="text-base sm:text-2xl font-black text-red-500">{lives}</div>
            </div>

            <div className="bg-gradient-to-br from-white to-green-50 backdrop-blur-sm rounded-xl px-2 sm:px-4 py-1 sm:py-2 shadow-lg border border-green-200 flex-1">
              <div className="text-slate-600 font-semibold text-[10px] sm:text-xs uppercase tracking-wider">Time</div>
              <div className="text-base sm:text-2xl font-black text-green-600">{timeLeft}s</div>
            </div>
          </div>

          {/* Scenario Card */}
          <div className="bg-gradient-to-br from-white to-amber-50 backdrop-blur-sm rounded-2xl p-3 sm:p-6 shadow-2xl border-2 border-amber-300">
            <div className="text-center mb-2 sm:mb-4">
              <div className="text-4xl sm:text-6xl mb-1 sm:mb-2">{currentScenario.emoji}</div>
              <h2 className="text-lg sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">
                {currentScenario.title}
              </h2>
              <p className="text-slate-600 text-xs sm:text-base mb-2 sm:mb-4">
                {currentScenario.context}
              </p>
              <div className="inline-block bg-amber-100 border-2 border-amber-400 rounded-xl px-3 py-1 sm:px-4 sm:py-2">
                <p className="font-bold text-amber-800 text-xs sm:text-base">
                  {currentScenario.description}
                </p>
              </div>
            </div>

            {/* Values Display */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-4">
              <div className="bg-white rounded-xl p-2 sm:p-3 border-2 border-blue-300 text-center">
                <div className="text-[10px] sm:text-xs text-slate-600 font-semibold">Principal (P)</div>
                <div className="text-sm sm:text-xl font-black text-blue-600">₹{currentScenario.principal}</div>
              </div>
              <div className="bg-white rounded-xl p-2 sm:p-3 border-2 border-green-300 text-center">
                <div className="text-[10px] sm:text-xs text-slate-600 font-semibold">Rate (R)</div>
                <div className="text-sm sm:text-xl font-black text-green-600">{currentScenario.rate}%</div>
              </div>
              <div className="bg-white rounded-xl p-2 sm:p-3 border-2 border-purple-300 text-center">
                <div className="text-[10px] sm:text-xs text-slate-600 font-semibold">Time (T)</div>
                <div className="text-sm sm:text-xl font-black text-purple-600">{currentScenario.time} yrs</div>
              </div>
            </div>

            {/* Formula Help */}
            <div className="mb-4">
              <button
                onClick={() => setShowFormula(!showFormula)}
                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
              >
                {showFormula ? '🔼 Hide' : '📖 Show'} Formula
              </button>
              
              {showFormula && (
                <div className="mt-3 bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                  {currentScenario.type === 'simple' ? (
                    <div>
                      <p className="font-bold text-blue-800 mb-2">Simple Interest Formula:</p>
                      <p className="text-lg font-mono text-blue-900">SI = (P × R × T) / 100</p>
                      <p className="text-sm text-blue-700 mt-2">
                        Where P = Principal, R = Rate%, T = Time in years
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-blue-800 mb-2">Compound Interest Formula:</p>
                      <p className="text-lg font-mono text-blue-900">CI = P(1 + R/100)^T - P</p>
                      <p className="text-sm text-blue-700 mt-2">
                        Where P = Principal, R = Rate%, T = Time in years
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Answer Input */}
            {!feedback.show && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-amber-600">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter interest amount"
                      className="w-full pl-12 pr-4 py-4 text-black text-xl font-bold border-3 border-amber-300 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={checkAnswer}
                    disabled={userAnswer === ''}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    ✓ Check
                  </button>
                </div>
              </div>
            )}

            {/* Feedback */}
            {feedback.show && (
              <div className={`p-4 rounded-xl border-2 ${
                feedback.correct 
                  ? 'bg-green-50 border-green-400' 
                  : 'bg-red-50 border-red-400'
              }`}>
                <p className={`font-bold text-lg mb-2 ${
                  feedback.correct ? 'text-green-800' : 'text-red-800'
                }`}>
                  {feedback.message}
                </p>
                <button
                  onClick={nextQuestion}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 mt-2"
                >
                  Next Question →
                </button>
              </div>
            )}
          </div>

          {/* Coin Animation Canvas - hidden on mobile during gameplay */}
          {coins.length > 0 && (
            <div className="hidden sm:flex justify-center">
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="border-4 border-white/30 rounded-3xl shadow-2xl bg-white max-w-full"
              />
            </div>
          )}
        </div>
      )}

      {gameStarted && !gameOver && (
        <Link
          href="/maths"
          className="mt-4 text-slate-600 hover:text-amber-600 transition-all duration-300 font-semibold relative z-10 text-sm sm:text-base bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-200 hover:border-amber-400 hover:shadow-lg transform hover:scale-105"
        >
          ← Back to Math Games
        </Link>
      )}

      {gameOver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-10 text-center shadow-2xl max-w-md mx-4">
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Game Over!</h2>
            <div className="mb-6">
              <p className="text-2xl font-semibold text-amber-600 mb-2">Final Score: {score}</p>
              <p className="text-lg text-slate-600 mb-1">Level Reached: {level}</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 mb-6 border-2 border-amber-200">
              <h3 className="font-bold text-slate-800 mb-2">💡 Remember:</h3>
              <p className="text-sm text-slate-700 mb-2">
                <strong>Simple Interest:</strong> SI = (P × R × T) / 100
              </p>
              <p className="text-sm text-slate-700">
                <strong>Compound Interest:</strong> CI = P(1 + R/100)^T - P
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
                href="/maths"
                className="block w-full bg-slate-500 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                ← Back to Math Games
              </Link>
            </div>
          </div>
        </div>
      )}

      {!gameStarted && !gameOver && !showInstructions && (
        <Link
          href="/maths"
          className="mt-4 sm:mt-6 text-slate-600 hover:text-amber-600 transition-all duration-300 font-semibold relative z-10 text-sm sm:text-base bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-200 hover:border-amber-400 hover:shadow-lg transform hover:scale-105"
        >
          ← Back to Math Games
        </Link>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-amber-50 to-yellow-50 rounded-3xl p-6 sm:p-10 text-center max-w-3xl shadow-2xl border-4 border-white/30 max-h-[90vh] overflow-y-auto">
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 mb-3">
              Interest Calc
            </h2>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-6">
              Learn Interest Calculations!
            </h3>
            
            <div className="bg-white rounded-2xl p-6 mb-6 border border-amber-200 text-left">
              <h4 className="font-bold text-lg text-slate-800 mb-3">🎯 How to Play:</h4>
              <div className="space-y-2 text-slate-700">
                <p className="flex items-start">
                  <span className="text-amber-500 font-bold mr-3">•</span>
                  <span>Read the real-life scenario carefully</span>
                </p>
                <p className="flex items-start">
                  <span className="text-orange-500 font-bold mr-3">•</span>
                  <span>Calculate either Simple or Compound Interest</span>
                </p>
                <p className="flex items-start">
                  <span className="text-amber-500 font-bold mr-3">•</span>
                  <span>Use the formula help if you need it</span>
                </p>
                <p className="flex items-start">
                  <span className="text-orange-500 font-bold mr-3">•</span>
                  <span>Answer within 30 seconds for bonus points</span>
                </p>
                <p className="flex items-start">
                  <span className="text-amber-500 font-bold mr-3">•</span>
                  <span>Watch coins rain when you&apos;re correct!</span>
                </p>
                <p className="flex items-start">
                  <span className="text-orange-500 font-bold mr-3">•</span>
                  <span>You have 3 lives - make them count!</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 px-12 rounded-2xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Calculating! 💰
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
