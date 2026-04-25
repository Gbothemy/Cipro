'use client';
import { useState, useEffect, lazy, Suspense } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

const GAMES = [
  { id: 'trivia', name: 'Trivia Quiz', icon: '🧠', desc: 'Answer questions, earn points', points: '15-60', color: 'from-blue-500 to-cyan-500', dailyLimit: 5 },
  { id: 'memory', name: 'Memory Match', icon: '🃏', desc: 'Match cards to win big', points: '30-100', color: 'from-purple-500 to-pink-500', dailyLimit: 5 },
  { id: 'puzzle', name: 'Puzzle Challenge', icon: '🧩', desc: 'Solve logic puzzles', points: '20-80', color: 'from-amber-500 to-orange-500', dailyLimit: 5 },
  { id: 'spin', name: 'Spin Wheel', icon: '🎡', desc: 'Spin for lucky rewards', points: '5-200', color: 'from-emerald-500 to-teal-500', dailyLimit: 3 },
];

export default function GamePage() {
  const { user, addPoints, addNotification } = useStore();
  const [activeGame, setActiveGame] = useState(null);
  const [attempts, setAttempts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.userId) loadAttempts();
  }, [user?.userId]);

  const loadAttempts = async () => {
    try {
      const data = await db.getGameAttempts(user.userId, null, 24);
      const counts = {};
      data.forEach((a) => { counts[a.game_type] = (counts[a.game_type] || 0) + 1; });
      setAttempts(counts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGameComplete = async (gameId, result) => {
    try {
      await db.recordGameAttempt(user.userId, gameId, result);
      if (result.points > 0) {
        await db.addPoints(user.userId, result.points);
        addPoints(result.points);
        addNotification({ type: 'success', title: 'Points Earned!', message: `+${result.points} points from ${gameId}` });
      }
      setAttempts((prev) => ({ ...prev, [gameId]: (prev[gameId] || 0) + 1 }));
    } catch (e) {
      console.error(e);
    }
    setActiveGame(null);
  };

  const getRemainingAttempts = (game) => {
    const used = attempts[game.id] || 0;
    return Math.max(0, game.dailyLimit - used);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Game Mining</h1>
        <p className="text-slate-400 mt-1">Play games to earn Cipro points and crypto rewards</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Points', value: (user?.points || 0).toLocaleString(), icon: '💎' },
          { label: 'VIP Level', value: `Level ${user?.vipLevel || 1}`, icon: '⭐' },
          { label: 'Day Streak', value: `${user?.dayStreak || 0} days`, icon: '🔥' },
          { label: 'Games Today', value: Object.values(attempts).reduce((a, b) => a + b, 0), icon: '🎮' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Games grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {GAMES.map((game) => {
          const remaining = getRemainingAttempts(game);
          const locked = remaining === 0;
          return (
            <div
              key={game.id}
              onClick={() => !locked && setActiveGame(game.id)}
              className={`card p-6 transition-all duration-300 ${
                locked
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:border-primary/40 hover:shadow-card-hover hover:-translate-y-1'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
                {game.icon}
              </div>
              <h3 className="font-bold text-white mb-1">{game.name}</h3>
              <p className="text-xs text-slate-400 mb-4">{game.desc}</p>
              <div className="flex items-center justify-between">
                <span className="badge-primary text-xs">+{game.points} pts</span>
                <span className={`text-xs font-medium ${locked ? 'text-red-400' : 'text-emerald-400'}`}>
                  {locked ? 'Limit reached' : `${remaining} left`}
                </span>
              </div>
              {!locked && (
                <button className="btn-primary w-full mt-4 py-2.5 text-sm">
                  Play Now
                </button>
              )}
              {locked && (
                <div className="w-full mt-4 py-2.5 text-sm text-center text-slate-500 bg-white/5 rounded-xl">
                  Resets tomorrow
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Game Modal */}
      {activeGame && (
        <GameModal
          gameId={activeGame}
          user={user}
          onComplete={handleGameComplete}
          onClose={() => setActiveGame(null)}
        />
      )}
    </div>
  );
}

function GameModal({ gameId, user, onComplete, onClose }) {
  const game = GAMES.find((g) => g.id === gameId);

  // Simple inline game implementations
  const renderGame = () => {
    switch (gameId) {
      case 'trivia': return <TriviaInline onComplete={onComplete} gameId={gameId} />;
      case 'memory': return <MemoryInline onComplete={onComplete} gameId={gameId} />;
      case 'spin': return <SpinInline onComplete={onComplete} gameId={gameId} />;
      default: return <PuzzleInline onComplete={onComplete} gameId={gameId} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-dark-800 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{game?.icon}</span>
            <div>
              <h2 className="font-bold text-white">{game?.name}</h2>
              <p className="text-xs text-slate-400">Earn up to {game?.points} points</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>
        <div className="p-5">{renderGame()}</div>
      </div>
    </div>
  );
}

// ── Trivia Game ──────────────────────────────────────────────────────────────
const TRIVIA_QUESTIONS = [
  { q: 'What is Bitcoin?', options: ['A cryptocurrency', 'A bank', 'A stock', 'A bond'], answer: 0 },
  { q: 'What does "DeFi" stand for?', options: ['Decentralized Finance', 'Digital Finance', 'Defined Finance', 'Default Finance'], answer: 0 },
  { q: 'What is a blockchain?', options: ['A chain of blocks', 'A distributed ledger', 'A type of database', 'All of the above'], answer: 3 },
  { q: 'What is Ethereum?', options: ['A cryptocurrency platform', 'A bank', 'A game', 'A social network'], answer: 0 },
  { q: 'What is a crypto wallet?', options: ['Stores private keys', 'Stores coins physically', 'A bank account', 'A credit card'], answer: 0 },
];

function TriviaInline({ onComplete, gameId }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const q = TRIVIA_QUESTIONS[idx];

  const pick = (i) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === q.answer;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (idx + 1 < TRIVIA_QUESTIONS.length) { setIdx((x) => x + 1); setSelected(null); }
      else setDone(true);
    }, 800);
  };

  if (done) {
    const pts = score * 12;
    return (
      <div className="text-center py-4">
        <div className="text-5xl mb-3">🎉</div>
        <h3 className="text-xl font-bold text-white mb-1">{score}/{TRIVIA_QUESTIONS.length} Correct!</h3>
        <p className="text-slate-400 mb-6">You earned <span className="text-primary font-bold">+{pts} points</span></p>
        <button onClick={() => onComplete(gameId, { points: pts, won: score > 2, score })} className="btn-primary px-8">Claim Reward</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-4">
        <span>Question {idx + 1}/{TRIVIA_QUESTIONS.length}</span>
        <span className="text-primary font-medium">{score} correct</span>
      </div>
      <p className="font-semibold text-white mb-4">{q.q}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 ${
              selected === null ? 'border-white/10 bg-white/5 hover:border-primary/40 hover:bg-primary/10 text-slate-300' :
              i === q.answer ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' :
              selected === i ? 'border-red-500/50 bg-red-500/10 text-red-400' :
              'border-white/5 bg-white/3 text-slate-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Memory Game ──────────────────────────────────────────────────────────────
const EMOJIS = ['🎮', '💎', '🚀', '🌟', '🎯', '🏆', '💰', '🎁'];

function MemoryInline({ onComplete, gameId }) {
  const [cards, setCards] = useState(() => {
    const deck = [...EMOJIS, ...EMOJIS].map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }));
    return deck.sort(() => Math.random() - 0.5);
  });
  const [flipped, setFlipped] = useState([]);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);

  const flip = (id) => {
    if (flipped.length === 2 || cards[id].flipped || cards[id].matched) return;
    const newCards = cards.map((c) => c.id === id ? { ...c, flipped: true } : c);
    const newFlipped = [...flipped, id];
    setCards(newCards);
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newFlipped;
      if (newCards[a].emoji === newCards[b].emoji) {
        const matched = newCards.map((c) => newFlipped.includes(c.id) ? { ...c, matched: true } : c);
        setCards(matched);
        setFlipped([]);
        if (matched.every((c) => c.matched)) setDone(true);
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((c) => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
          setFlipped([]);
        }, 900);
      }
    }
  };

  if (done) {
    const pts = Math.max(100 - moves * 5, 30);
    return (
      <div className="text-center py-4">
        <div className="text-5xl mb-3">🏆</div>
        <h3 className="text-xl font-bold text-white mb-1">All Matched!</h3>
        <p className="text-slate-400 mb-6">Completed in {moves} moves — <span className="text-primary font-bold">+{pts} points</span></p>
        <button onClick={() => onComplete(gameId, { points: pts, won: true, score: pts })} className="btn-primary px-8">Claim Reward</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-4">
        <span>Moves: {moves}</span>
        <span className="text-primary">{cards.filter((c) => c.matched).length / 2}/{EMOJIS.length} matched</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => flip(card.id)}
            className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 border ${
              card.flipped || card.matched
                ? 'bg-primary/15 border-primary/30 scale-105'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            } ${card.matched ? 'opacity-50' : ''}`}
          >
            {card.flipped || card.matched ? card.emoji : '❓'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Spin Wheel ───────────────────────────────────────────────────────────────
const SPIN_PRIZES = [
  { label: '+5 pts', points: 5, color: '#667eea' },
  { label: '+20 pts', points: 20, color: '#764ba2' },
  { label: '+50 pts', points: 50, color: '#f093fb' },
  { label: '+10 pts', points: 10, color: '#4facfe' },
  { label: '+100 pts', points: 100, color: '#43e97b' },
  { label: '+15 pts', points: 15, color: '#f5576c' },
  { label: '+200 pts', points: 200, color: '#ffd700' },
  { label: '+30 pts', points: 30, color: '#00f2fe' },
];

function SpinInline({ onComplete, gameId }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    const idx = Math.floor(Math.random() * SPIN_PRIZES.length);
    const spins = 5 + Math.random() * 3;
    const deg = spins * 360 + (idx * (360 / SPIN_PRIZES.length));
    setRotation((r) => r + deg);
    setTimeout(() => { setSpinning(false); setResult(SPIN_PRIZES[idx]); }, 3000);
  };

  return (
    <div className="text-center">
      {/* Simple visual wheel */}
      <div
        className="w-48 h-48 mx-auto rounded-full border-4 border-primary/40 flex items-center justify-center text-5xl mb-6 transition-transform duration-[3000ms] ease-out shadow-brand"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        🎡
      </div>
      {result ? (
        <div>
          <p className="text-2xl font-black text-white mb-1">{result.label}</p>
          <p className="text-slate-400 mb-6">Lucky spin!</p>
          <button onClick={() => onComplete(gameId, { points: result.points, won: true, score: result.points })} className="btn-primary px-8">
            Claim {result.points} Points
          </button>
        </div>
      ) : (
        <button onClick={spin} disabled={spinning} className="btn-primary px-10 py-3.5">
          {spinning ? '🌀 Spinning...' : '🎡 Spin Now'}
        </button>
      )}
    </div>
  );
}

// ── Puzzle Game ──────────────────────────────────────────────────────────────
const PUZZLES = [
  { q: 'I have 8 pairs of cards. How many cards total?', answer: '16', hint: '8 × 2' },
  { q: 'If you earn 50 points per game and play 4 games, how many points?', answer: '200', hint: '50 × 4' },
  { q: 'What comes next: 2, 4, 8, 16, __?', answer: '32', hint: 'Each doubles' },
  { q: 'A wallet has 3 SOL. You earn 2 more. How many SOL?', answer: '5', hint: '3 + 2' },
];

function PuzzleInline({ onComplete, gameId }) {
  const [puzzle] = useState(() => PUZZLES[Math.floor(Math.random() * PUZZLES.length)]);
  const [input, setInput] = useState('');
  const [tries, setTries] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [done, setDone] = useState(false);

  const check = () => {
    if (input.trim() === puzzle.answer) {
      setDone(true);
    } else {
      setTries((t) => t + 1);
      setFeedback(`Not quite. Hint: ${puzzle.hint}`);
    }
  };

  const pts = Math.max(80 - tries * 20, 20);

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="text-5xl mb-3">🧩</div>
        <h3 className="text-xl font-bold text-white mb-1">Solved!</h3>
        <p className="text-slate-400 mb-6">Answer: <strong className="text-white">{puzzle.answer}</strong> — <span className="text-primary font-bold">+{pts} points</span></p>
        <button onClick={() => onComplete(gameId, { points: pts, won: true, score: pts })} className="btn-primary px-8">Claim Reward</button>
      </div>
    );
  }

  return (
    <div>
      <p className="font-semibold text-white mb-6 text-lg">{puzzle.q}</p>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && check()}
        placeholder="Your answer..."
        className="input-field mb-3"
      />
      {feedback && <p className="text-amber-400 text-sm mb-3">{feedback}</p>}
      <button onClick={check} className="btn-primary w-full py-3">Submit Answer</button>
    </div>
  );
}
