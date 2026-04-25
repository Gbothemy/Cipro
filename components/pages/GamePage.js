'use client';
import { useState, useEffect, lazy, Suspense } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';
import { TRIVIA_QUESTIONS } from '../../lib/triviaQuestions';

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
        <p className="text-muted mt-2">Play games to earn Cipro points and crypto rewards</p>
      </div>

      {/* Stats row */}
      <div className="grid-4 mb-8">
        {[
          { label: 'Total Points', value: (user?.points || 0).toLocaleString(), icon: '💎' },
          { label: 'VIP Level', value: `Level ${user?.vipLevel || 1}`, icon: '⭐' },
          { label: 'Day Streak', value: `${user?.dayStreak || 0} days`, icon: '🔥' },
          { label: 'Games Today', value: Object.values(attempts).reduce((a, b) => a + b, 0), icon: '🎮' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Games grid */}
      <div className="grid-4">
        {GAMES.map((game) => {
          const remaining = getRemainingAttempts(game);
          const locked = remaining === 0;
          return (
            <div
              key={game.id}
              onClick={() => !locked && setActiveGame(game.id)}
              className={locked ? 'card p-6 opacity-50 cursor-not-allowed' : 'card-hover p-6'}
              style={{ opacity: locked ? 0.5 : 1 }}
            >
              <div 
                className="flex items-center justify-center rounded-xl mb-4"
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  background: `linear-gradient(135deg, ${game.color.includes('blue') ? '#667eea, #764ba2' : game.color.includes('purple') ? '#764ba2, #f093fb' : game.color.includes('amber') ? '#f6d365, #fda085' : '#43e97b, #38f9d7'})`,
                  fontSize: '1.75rem',
                  boxShadow: '0 4px 20px rgba(102,126,234,0.3)'
                }}
              >
                {game.icon}
              </div>
              <h3 className="font-bold text-white mb-2">{game.name}</h3>
              <p className="text-sm text-muted mb-4">{game.desc}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="badge-primary">+{game.points} pts</span>
                <span className={`text-xs font-semibold ${locked ? 'text-error' : 'text-success'}`}>
                  {locked ? 'Limit reached' : `${remaining} left`}
                </span>
              </div>
              {!locked && (
                <button className="btn btn-primary btn-full">
                  Play Now
                </button>
              )}
              {locked && (
                <div className="w-full py-3 text-sm text-center text-dim rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
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
    <div className="modal-overlay">
      <div className="modal animate-slide-up">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '1.75rem' }}>{game?.icon}</span>
            <div>
              <h2 className="font-bold text-white">{game?.name}</h2>
              <p className="text-xs text-muted">Earn up to {game?.points} points</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn-ghost"
            style={{ width: '2rem', height: '2rem', padding: 0, minWidth: 'auto' }}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">{renderGame()}</div>
      </div>
    </div>
  );
}

// ── Trivia Game ──────────────────────────────────────────────────────────────
// Questions imported from lib/triviaQuestions.js (500+ questions)

function TriviaInline({ onComplete, gameId }) {
  const [questions] = useState(() => {
    // Shuffle and pick 5 random questions from 500+ question pool
    const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  });
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const q = questions[idx];

  const pick = (i) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === q.answer;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (idx + 1 < questions.length) { setIdx((x) => x + 1); setSelected(null); }
      else setDone(true);
    }, 800);
  };

  if (done) {
    const pts = score * 12;
    return (
      <div className="text-center py-4">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h3 className="text-xl font-bold text-white mb-2">{score}/{questions.length} Correct!</h3>
        <p className="text-muted mb-6">You earned <span className="text-primary font-bold">+{pts} points</span></p>
        <button onClick={() => onComplete(gameId, { points: pts, won: score > 2, score })} className="btn btn-primary px-8">Claim Reward</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between text-xs text-muted mb-4">
        <span>Question {idx + 1}/{questions.length}</span>
        <span className="text-primary font-semibold">{score} correct</span>
      </div>
      <p className="font-semibold text-white mb-4">{q.q}</p>
      <div className="flex-col gap-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.answer;
          const isSelected = selected === i;
          const showResult = selected !== null;
          
          let btnClass = 'btn w-full text-left px-4 py-3 text-sm';
          let btnStyle = { justifyContent: 'flex-start' };
          
          if (!showResult) {
            btnClass += ' btn-secondary';
          } else if (isCorrect) {
            btnClass += ' badge-success';
          } else if (isSelected) {
            btnClass += ' badge-error';
          } else {
            btnClass += ' opacity-50';
          }
          
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              className={btnClass}
              style={btnStyle}
            >
              {opt}
            </button>
          );
        })}
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
    if (flipped.length === 2 || cards.find(c => c.id === id)?.flipped || cards.find(c => c.id === id)?.matched) return;
    
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    
    const newCards = cards.map((c) => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    
    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = newFlipped;
      const firstCard = newCards.find(c => c.id === firstId);
      const secondCard = newCards.find(c => c.id === secondId);
      
      if (firstCard.emoji === secondCard.emoji) {
        // Match found
        const matched = newCards.map((c) => 
          c.id === firstId || c.id === secondId ? { ...c, matched: true } : c
        );
        setCards(matched);
        setFlipped([]);
        
        // Check if all matched
        if (matched.every((c) => c.matched)) {
          setTimeout(() => setDone(true), 500);
        }
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setCards((prev) => prev.map((c) => 
            c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c
          ));
          setFlipped([]);
        }, 900);
      }
    }
  };

  if (done) {
    const pts = Math.max(100 - moves * 5, 30);
    return (
      <div className="text-center py-4">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
        <h3 className="text-xl font-bold text-white mb-2">All Matched!</h3>
        <p className="text-muted mb-6">Completed in {moves} moves — <span className="text-primary font-bold">+{pts} points</span></p>
        <button onClick={() => onComplete(gameId, { points: pts, won: true, score: pts })} className="btn btn-primary px-8">Claim Reward</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between text-xs text-muted mb-4">
        <span>Moves: {moves}</span>
        <span className="text-primary">{cards.filter((c) => c.matched).length / 2}/{EMOJIS.length} matched</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => flip(card.id)}
            className="btn"
            style={{
              aspectRatio: '1',
              fontSize: '1.75rem',
              background: card.flipped || card.matched ? 'rgba(102,126,234,0.15)' : 'rgba(255,255,255,0.05)',
              border: card.flipped || card.matched ? '1px solid rgba(102,126,234,0.3)' : '1px solid rgba(255,255,255,0.1)',
              opacity: card.matched ? 0.5 : 1,
              transform: card.flipped || card.matched ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.3s'
            }}
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
        className="rounded-full flex items-center justify-center shadow-brand"
        style={{
          width: '12rem',
          height: '12rem',
          margin: '0 auto 1.5rem',
          border: '4px solid rgba(102,126,234,0.4)',
          fontSize: '3rem',
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 3000ms ease-out'
        }}
      >
        🎡
      </div>
      {result ? (
        <div>
          <p className="text-2xl font-black text-white mb-2">{result.label}</p>
          <p className="text-muted mb-6">Lucky spin!</p>
          <button onClick={() => onComplete(gameId, { points: result.points, won: true, score: result.points })} className="btn btn-primary px-8">
            Claim {result.points} Points
          </button>
        </div>
      ) : (
        <button onClick={spin} disabled={spinning} className="btn btn-primary px-10 py-4">
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
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧩</div>
        <h3 className="text-xl font-bold text-white mb-2">Solved!</h3>
        <p className="text-muted mb-6">Answer: <strong className="text-white">{puzzle.answer}</strong> — <span className="text-primary font-bold">+{pts} points</span></p>
        <button onClick={() => onComplete(gameId, { points: pts, won: true, score: pts })} className="btn btn-primary px-8">Claim Reward</button>
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
        className="input mb-3"
      />
      {feedback && <p className="text-warning text-sm mb-3">{feedback}</p>}
      <button onClick={check} className="btn btn-primary btn-full py-3">Submit Answer</button>
    </div>
  );
}
