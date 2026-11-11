import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  Languages,
  Award,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  KeyRound,
  Eye,
  Trophy,
} from 'lucide-react';
import { QUESTIONS, SECRET_WORD, SECRET_WORD_CLUE_ES, SECRET_WORD_CLUE_HY, SECRET_WORD_TRANSLATION } from './questions';
import { OptionKey, WheelSector } from './types';
import { sound } from './sound';
import { Wheel } from './Wheel';

// Spanish alphabet for guessing without hints
const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

export default function App() {
  // Game State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [revealedLetters, setRevealedLetters] = useState<Set<string>>(new Set());
  const [guessedAlphabet, setGuessedAlphabet] = useState<Map<string, boolean>>(new Map()); // letter -> isCorrect
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAllTranslations, setShowAllTranslations] = useState(false);

  // Per-question interactive states
  const [revealedTranslationIds, setRevealedTranslationIds] = useState<Set<string>>(new Set());
  const [userAnswers, setUserAnswers] = useState<Record<number, OptionKey>>({});
  const [canPickLetter, setCanPickLetter] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'correct' | 'wrong' | 'letter_hit' | 'letter_miss' | null;
    messageEs: string;
    messageHy: string;
  } | null>(null);

  // Modals & Panels
  const [showWordGuessModal, setShowWordGuessModal] = useState(false);
  const [wordGuessInput, setWordGuessInput] = useState('');
  const [wordGuessError, setWordGuessError] = useState(false);
  const [isGameOverWin, setIsGameOverWin] = useState(false);
  const [showQuestionsDrawer, setShowQuestionsDrawer] = useState(false);

  const currentQ = QUESTIONS[currentQuestionIdx];
  const totalQuestions = QUESTIONS.length;
  const isCurrentAnswered = userAnswers[currentQ.id] !== undefined;
  const isCurrentCorrect = isCurrentAnswered && userAnswers[currentQ.id] === currentQ.correct;

  // Toggle sound
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  // Toggle translation for a specific item (e.g. "q-1", "opt-1-A")
  const toggleTranslation = (id: string) => {
    setRevealedTranslationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isTranslated = (id: string) => showAllTranslations || revealedTranslationIds.has(id);

  // Trigger grand victory celebration
  const triggerVictory = () => {
    setIsGameOverWin(true);
    sound.playWin();
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 120,
        origin: { y: 0.5 },
      });
    }, 400);
  };

  // Handle Question Option Choice
  const handleSelectOption = (key: OptionKey) => {
    if (isCurrentAnswered) return;

    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: key }));

    if (key === currentQ.correct) {
      // Correct!
      const earnedPoints = 150 * multiplier;
      setScore((s) => s + earnedPoints);
      setMultiplier(1); // reset multiplier
      sound.playCorrect();
      setCanPickLetter(true);
      setStatusFeedback({
        type: 'correct',
        messageEs: '¡Respuesta correcta! Ahora elige una letra del alfabeto abajo (sin pistas).',
        messageHy: 'Ճիշտ պատասխան է! Այժմ ներքևի ցուցակից ինքդ ընտրի՛ր տառը (առանց հուշման):',
      });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } else {
      // Incorrect! As requested: "и еесли ответ неверный всё равно продолжить играть"
      sound.playWrong();
      setCanPickLetter(false);
      setStatusFeedback({
        type: 'wrong',
        messageEs: 'Respuesta incorrecta, ¡pero el juego continúa! Revisa la explicación.',
        messageHy: 'Սխալ պատասխան է, բայց խաղը շարունակվում է: Կարդա՛ բացատրությունը:',
      });
    }
  };

  // Handle Letter Choice from Alphabet
  const handlePickLetter = (letter: string) => {
    if (!canPickLetter || guessedAlphabet.has(letter)) return;

    const upperLetter = letter.toUpperCase();
    const isHit = SECRET_WORD.includes(upperLetter);

    const nextGuessed = new Map(guessedAlphabet);
    nextGuessed.set(upperLetter, isHit);
    setGuessedAlphabet(nextGuessed);

    if (isHit) {
      sound.playCorrect();
      const nextRevealed = new Set(revealedLetters);
      nextRevealed.add(upperLetter);
      setRevealedLetters(nextRevealed);
      setScore((s) => s + 300);

      setStatusFeedback({
        type: 'letter_hit',
        messageEs: `¡Excelente! La letra «${upperLetter}» está en la palabra secreta.`,
        messageHy: `Հիանալի՛ է: «${upperLetter}» տառը բացվեց табло-ում:`,
      });

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.4 },
      });

      // Check if all letters of SILBATO are revealed!
      const allRevealed = SECRET_WORD.split('').every((char) => nextRevealed.has(char));
      if (allRevealed) {
        setTimeout(triggerVictory, 600);
      }
    } else {
      sound.playWrong();
      setStatusFeedback({
        type: 'letter_miss',
        messageEs: `La letra «${upperLetter}» no está en la palabra. ¡Sigue jugando con la siguiente pregunta!`,
        messageHy: `«${upperLetter}» տառը չկա բառում, բայց խաղը շարունակվում է: Անցի՛ր հաջորդ հարցին:`,
      });
    }

    setCanPickLetter(false);
  };

  // Handle Wheel Spin Result
  const handleSpinEnd = (sector: WheelSector) => {
    if (sector.type === 'points') {
      setScore((s) => s + sector.points);
    } else if (sector.type === 'double') {
      setMultiplier(2);
    } else if (sector.type === 'open_letter') {
      // Sector + : grant letter pick opportunity immediately!
      setCanPickLetter(true);
      setStatusFeedback({
        type: 'letter_hit',
        messageEs: '¡Sector +! Puedes elegir una letra del alfabeto ahora mismo.',
        messageHy: 'Սեկտոր +! Կարող ես անմիջապես տառ ընտրել այբուբենից:',
      });
    }
  };

  // Direct Word Guess
  const handleDirectWordGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanGuess = wordGuessInput.trim().toUpperCase();
    if (cleanGuess === SECRET_WORD) {
      setShowWordGuessModal(false);
      // Reveal all letters
      const fullSet = new Set(SECRET_WORD.split(''));
      setRevealedLetters(fullSet);
      setScore((s) => s + 2000);
      triggerVictory();
    } else {
      sound.playWrong();
      setWordGuessError(true);
      setTimeout(() => setWordGuessError(false), 2000);
    }
  };

  // Reset entire game
  const resetGame = () => {
    setCurrentQuestionIdx(0);
    setRevealedLetters(new Set());
    setGuessedAlphabet(new Map());
    setScore(0);
    setMultiplier(1);
    setUserAnswers({});
    setCanPickLetter(false);
    setStatusFeedback(null);
    setIsGameOverWin(false);
    setShowWordGuessModal(false);
    setWordGuessInput('');
  };

  // Question navigation
  const nextQuestion = () => {
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx((i) => i + 1);
      setCanPickLetter(false);
      setStatusFeedback(null);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((i) => i - 1);
      setCanPickLetter(false);
      setStatusFeedback(null);
    }
  };

  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = Object.entries(userAnswers).filter(
    ([qId, ans]) => QUESTIONS.find((q) => q.id === Number(qId))?.correct === ans
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-900 pb-12">
      {/* Top Header / Bar */}
      <header className="border-b border-indigo-900/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Theme Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
              ★
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                  ПОЛЕ ЧУДЕС · ՀՐԱՇՔՆԵՐԻ ԴԱՇՏ
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  A2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Քաղաքում ճանապարհ գտնելը և տրանսպորտը · En la ciudad y transporte
              </p>
            </div>
          </div>

          {/* Action buttons & Stats */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {/* Score */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-sm">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{score}</span>
              <span className="text-[11px] text-amber-400/70 font-normal">միավոր</span>
            </div>

            {/* Global Translation Toggle */}
            <button
              onClick={() => setShowAllTranslations(!showAllTranslations)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                showAllTranslations
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title="Ցույց տալ բոլոր հայերեն թարգմանությունները"
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Բոլոր թարգմանությունները</span>
              <span className="sm:hidden">Հայերեն</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title={soundEnabled ? 'Ձայնն անջատել' : 'Ձայնը միացնել'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Questions Drawer Toggle */}
            <button
              onClick={() => setShowQuestionsDrawer(!showQuestionsDrawer)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium"
            >
              Հարցեր ({answeredCount}/20)
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-4 pt-6 flex-1 flex flex-col gap-6">
        {/* ============================================================== */}
        {/* SECRET WORD LETTER BOARD (ТАБЛО ПОЛЕ ЧУДЕС)                     */}
        {/* ============================================================== */}
        <section className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 border-2 border-amber-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-1/4 w-72 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
            <div>
              <span className="text-xs uppercase tracking-widest font-black text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                ԳԱՂՏՆԻ ԲԱՌԸ · СЕКРЕТНОЕ СЛОВО (7 ТАՌ)
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Ճիշտ պատասխանիր հարցերին և բացիր տառերը հերթով կամ ասա բառն ամբողջությամբ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWordGuessModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Գուշակել ամբողջ բառը
              </button>
            </div>
          </div>

          {/* Word Tiles Grid */}
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 py-4">
            {SECRET_WORD.split('').map((char, idx) => {
              const isRevealed = revealedLetters.has(char);
              return (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-[10px] text-amber-400/70 font-mono mb-1 font-semibold">
                    {idx + 1}
                  </span>
                  <div
                    className={`w-11 h-14 sm:w-14 sm:h-18 rounded-xl flex items-center justify-center font-black text-2xl sm:text-3xl transition-all duration-500 transform shadow-xl select-none ${
                      isRevealed
                        ? 'bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-400 text-slate-950 border-2 border-yellow-100 scale-105 shadow-amber-500/40 rotate-0'
                        : 'bg-gradient-to-b from-indigo-950 to-slate-900 border-2 border-amber-500/30 text-amber-400/40 hover:border-amber-400/60'
                    }`}
                  >
                    {isRevealed ? (
                      char
                    ) : (
                      <span className="text-lg opacity-40">?</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hint / Clue */}
          <div className="mt-2 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-400 text-center sm:text-left">
              <span className="font-bold text-amber-400/90">Հուշում / Pista:</span>
              <span
                onClick={() => toggleTranslation('clue')}
                className="cursor-pointer underline decoration-dotted decoration-amber-400/40 hover:text-amber-200 transition-colors"
                title="Սեղմիր թարգմանելու համար"
              >
                {SECRET_WORD_CLUE_ES}
              </span>
            </div>

            {isTranslated('clue') && (
              <div className="text-amber-300 font-medium bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 text-center">
                🇦🇲 {SECRET_WORD_CLUE_HY}
              </div>
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* GAME PLAY AREA (Wheel + Question Card)                         */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Wheel of Fortune (Барабан) */}
          <div className="lg:col-span-4 bg-slate-900/80 border border-indigo-900/40 rounded-2xl p-5 shadow-xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 tracking-wider flex items-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                ՀՐԱՇՔՆԵՐԻ ԹՄԲՈՒԿԸ
              </span>
              {multiplier > 1 && (
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-orange-500 text-slate-950 animate-pulse">
                  x{multiplier} ԲՈՆՈՒՍ
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center mb-3">
              Պտտի՛ր թմբուկը լրացուցիչ միավորներ և «+» բոնուս շահելու համար
            </p>

            <Wheel onSpinEnd={handleSpinEnd} />
          </div>

          {/* RIGHT: Current Question Card */}
          <div className="lg:col-span-8 bg-slate-900/90 border border-indigo-900/50 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
            {/* Question Top Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs">
                  Հարց {currentQ.id} / {totalQuestions}
                </span>
                <span className="text-xs text-slate-400">Nivel A2</span>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-1">
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestionIdx === 0}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
                  title="Նախորդ հարցը"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextQuestion}
                  disabled={currentQuestionIdx === totalQuestions - 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
                  title="Հաջորդ հարցը"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Instruction badge */}
            <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span className="italic">Elige una respuesta correcta. — Ընտրի՛ր մեկ ճիշտ պատասխան։</span>
              <span className="text-[11px] text-amber-400/80 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                Կտտացրու իսպաներենին թարգմանության համար
              </span>
            </div>

            {/* Question Statement Box (Clickable for translation) */}
            <div
              onClick={() => toggleTranslation(`q-${currentQ.id}`)}
              className="group cursor-pointer p-4 rounded-xl bg-gradient-to-r from-slate-800/90 to-indigo-950/60 border border-slate-700/60 hover:border-amber-400/50 transition-all shadow-md relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-400 font-extrabold text-sm">{currentQ.id}.</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.speakSpanish(currentQ.es);
                      }}
                      className="p-1 rounded-md bg-slate-700/60 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-colors"
                      title="Լսել արտասանությունը (Իսպաներեն)"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-amber-200 transition-colors leading-relaxed">
                    {currentQ.es}
                  </h3>
                </div>

                <span className="text-[11px] font-medium text-amber-400/70 border border-amber-500/30 rounded-lg px-2 py-0.5 whitespace-nowrap self-start bg-slate-900/60">
                  {isTranslated(`q-${currentQ.id}`) ? '🇦🇲 Բացված է' : '👆 Թարգմանել'}
                </span>
              </div>

              {/* Armenian translation revealed on click */}
              {isTranslated(`q-${currentQ.id}`) && (
                <div className="mt-3 pt-2.5 border-t border-slate-700/80 text-sm font-medium text-amber-300 flex items-center gap-2">
                  <span className="text-xs bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 font-bold">
                    Հայերեն:
                  </span>
                  <span>{currentQ.hy}</span>
                </div>
              )}
            </div>

            {/* Options List (A, B, C, D) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((option) => {
                const optId = `opt-${currentQ.id}-${option.key}`;
                const isSelected = userAnswers[currentQ.id] === option.key;
                const isCorrectOption = option.key === currentQ.correct;
                const showResults = isCurrentAnswered;

                let cardStyle =
                  'bg-slate-800/70 border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-200';

                if (showResults) {
                  if (isCorrectOption) {
                    cardStyle =
                      'bg-emerald-950/80 border-emerald-500 text-emerald-100 shadow-emerald-500/20 shadow-md';
                  } else if (isSelected && !isCorrectOption) {
                    cardStyle =
                      'bg-rose-950/80 border-rose-500 text-rose-100 shadow-rose-500/20 shadow-md';
                  } else {
                    cardStyle = 'bg-slate-900/50 border-slate-800/80 text-slate-500 opacity-60';
                  }
                }

                return (
                  <div
                    key={option.key}
                    onClick={() => {
                      if (!isCurrentAnswered) {
                        handleSelectOption(option.key);
                      } else {
                        toggleTranslation(optId);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-sm ${cardStyle}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            showResults && isCorrectOption
                              ? 'bg-emerald-500 text-slate-950'
                              : showResults && isSelected && !isCorrectOption
                              ? 'bg-rose-500 text-slate-950'
                              : 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          {option.key}
                        </span>

                        <span className="font-semibold text-sm leading-snug">
                          {option.es}
                        </span>
                      </div>

                      {/* Sound button for option */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.speakSpanish(option.es);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-700/60 transition-colors shrink-0"
                        title="Լսել"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Armenian translation button / display */}
                    <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-xs">
                      {isTranslated(optId) ? (
                        <div className="text-amber-300 font-medium">
                          🇦🇲 {option.hy}
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTranslation(optId);
                          }}
                          className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                        >
                          <Languages className="w-3 h-3" />
                          <span>Թարգմանել (Հայերեն)</span>
                        </button>
                      )}

                      {showResults && isCorrectOption && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold ml-auto">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ճիշտ
                        </span>
                      )}
                      {showResults && isSelected && !isCorrectOption && (
                        <span className="flex items-center gap-1 text-[11px] text-rose-400 font-bold ml-auto">
                          <XCircle className="w-3.5 h-3.5" /> Քո ընտրությունը
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Answer Explanation & Feedback */}
            {statusFeedback && (
              <div
                className={`p-4 rounded-xl border flex flex-col gap-2 ${
                  statusFeedback.type === 'correct' || statusFeedback.type === 'letter_hit'
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {statusFeedback.type === 'correct' || statusFeedback.type === 'letter_hit' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <HelpCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold text-sm">{statusFeedback.messageEs}</p>
                    <p className="text-xs text-slate-300 mt-0.5">{statusFeedback.messageHy}</p>
                  </div>
                </div>

                {/* Grammar & vocabulary note */}
                {isCurrentAnswered && (
                  <div className="mt-1 pt-2 border-t border-slate-700/60 text-xs text-slate-300">
                    <p className="font-semibold text-amber-300">Պարզաբանում / Explicación:</p>
                    <p className="italic mt-0.5 text-slate-200">{currentQ.explanationEs}</p>
                    <p className="text-amber-200/90 mt-0.5">🇦🇲 {currentQ.explanationHy}</p>
                  </div>
                )}
              </div>
            )}

            {/* Continue playing buttons (especially when answer is incorrect or after picking letter) */}
            {isCurrentAnswered && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => {
                    // Retry question if desired
                    setUserAnswers((prev) => {
                      const copy = { ...prev };
                      delete copy[currentQ.id];
                      return copy;
                    });
                    setStatusFeedback(null);
                    setCanPickLetter(false);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Փորձել կրկին
                </button>

                <button
                  onClick={nextQuestion}
                  disabled={currentQuestionIdx === totalQuestions - 1}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all ml-auto"
                >
                  <span>Հաջորդ հարցը (Շարունակել)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ============================================================== */}
            {/* ALPHABET SELECTION (БЕЗ ПОДСКАЗОК - САМОМУ ВЫБРАТЬ БУКВУ)     */}
            {/* ============================================================== */}
            <div
              className={`mt-3 p-4 rounded-xl border transition-all ${
                canPickLetter
                  ? 'bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-400/60 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="font-extrabold text-xs sm:text-sm tracking-wide text-amber-300">
                    ՏԱՌԻ ԸՆՏՐՈՒԹՅՈՒՆ ՑՈՒՑԱԿԻՑ · ВЫБОР БУКВЫ (БЕЗ ПОДСКАЗОК)
                  </span>
                </div>
                {canPickLetter ? (
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-full">
                    Հերթը քոնն է! Ընտրի՛ր տառ
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Պատասխանիր ճիշտ տառ ընտրելու համար
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mb-3">
                Կտտացրու քո նախընտրած տառին։ Եթե այն կա «SILBATO» բառում, այն կբացվի табло-ում։
              </p>

              {/* Letter Buttons Grid */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                {ALPHABET.map((letter) => {
                  const isTried = guessedAlphabet.has(letter);
                  const isHit = isTried && guessedAlphabet.get(letter) === true;
                  const isMiss = isTried && guessedAlphabet.get(letter) === false;

                  let letterBtnStyle =
                    'bg-slate-800 text-slate-200 border-slate-700 hover:border-amber-400 hover:bg-slate-700 hover:text-white';

                  if (isHit) {
                    letterBtnStyle =
                      'bg-emerald-600 text-white border-emerald-400 cursor-not-allowed shadow-md font-black';
                  } else if (isMiss) {
                    letterBtnStyle =
                      'bg-slate-800/40 text-slate-500 border-slate-800 line-through cursor-not-allowed opacity-50';
                  } else if (!canPickLetter) {
                    letterBtnStyle =
                      'bg-slate-800/60 text-slate-400 border-slate-700/60 opacity-80 hover:border-slate-600';
                  }

                  return (
                    <button
                      key={letter}
                      disabled={isTried || !canPickLetter}
                      onClick={() => handlePickLetter(letter)}
                      className={`w-8 h-9 sm:w-9 sm:h-10 rounded-lg font-bold text-xs sm:text-sm border transition-all flex items-center justify-center ${letterBtnStyle}`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* DIRECT WORD GUESS MODAL                                        */}
      {/* ============================================================== */}
      {showWordGuessModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="text-center mb-4">
              <span className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 mx-auto flex items-center justify-center mb-2">
                <KeyRound className="w-6 h-6" />
              </span>
              <h3 className="text-lg font-black text-amber-300">
                Գուշակել ամբողջ բառը · Назвать всё слово
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Եթե արդեն գիտես գաղտնի բառը, գրիր այն այստեղ (7 տառ).
              </p>
            </div>

            <form onSubmit={handleDirectWordGuess} className="flex flex-col gap-4">
              <div>
                <input
                  type="text"
                  maxLength={10}
                  value={wordGuessInput}
                  onChange={(e) => setWordGuessInput(e.target.value)}
                  placeholder="Գրի՛ր բառը (օր. silbato)"
                  className="w-full text-center tracking-widest uppercase font-black text-xl py-3 px-4 rounded-xl bg-slate-950 border-2 border-slate-700 focus:border-amber-400 focus:outline-none text-amber-300 placeholder:text-slate-600"
                  autoFocus
                />
                {wordGuessError && (
                  <p className="text-xs text-rose-400 text-center font-bold mt-2 animate-bounce">
                    Սխալ է, փորձիր նորից կամ շարունակիր հարցերով:
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowWordGuessModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25"
                >
                  Ստուգել բառը
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* GRAND VICTORY MODAL                                            */}
      {/* ============================================================== */}
      {isGameOverWin && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950 border-4 border-amber-400 rounded-3xl max-w-lg w-full p-8 shadow-2xl text-center relative overflow-hidden">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-200 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/40 font-black text-4xl animate-bounce">
              <Trophy className="w-10 h-10 text-slate-950" />
            </div>

            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              ¡FELICIDADES! · ՇՆՈՐՀԱՎՈՐՈՒՄ ԵՆՔ!
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Դուք գուշակեցիք բառը!
            </h2>

            {/* Word Display */}
            <div className="my-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="text-3xl sm:text-4xl font-black tracking-widest text-amber-300">
                {SECRET_WORD}
              </div>
              <div className="text-sm font-bold text-slate-200 mt-1">
                Թարգմանություն՝ <span className="text-emerald-400">{SECRET_WORD_TRANSLATION}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 italic">
                «El árbitro usa el silbato en el estadio de fútbol.»
              </p>
              <p className="text-xs text-amber-200/80 mt-0.5">
                «Մրցավարը մարզադաշտում ֆուտբոլային խաղի ժամանակ օգտագործում է սուլիչը:»
              </p>
            </div>

            {/* Game Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400">Վաստակած միավորներ</span>
                <p className="text-xl font-black text-amber-400">{score}</p>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400">Ճիշտ պատասխաններ</span>
                <p className="text-xl font-black text-emerald-400">
                  {correctCount} / {answeredCount}
                </p>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-amber-500/30 transition-all hover:scale-105"
            >
              Խաղալ նորից · Играть заново
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* QUESTIONS OVERVIEW DRAWER                                      */}
      {/* ============================================================== */}
      {showQuestionsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="bg-slate-900 border-l border-indigo-900/60 w-full max-w-md h-full p-6 overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-100">
                  Բոլոր 20 հարցերը (A2)
                </h3>
                <p className="text-xs text-slate-400">
                  Պատասխանված՝ {answeredCount} / 20 (Ճիշտ՝ {correctCount})
                </p>
              </div>
              <button
                onClick={() => setShowQuestionsDrawer(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {QUESTIONS.map((q, idx) => {
                const ans = userAnswers[q.id];
                const isCorrect = ans === q.correct;
                const isCurrent = idx === currentQuestionIdx;

                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIdx(idx);
                      setShowQuestionsDrawer(false);
                      setCanPickLetter(false);
                      setStatusFeedback(null);
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                      isCurrent
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-800/40'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center shrink-0 ${
                        ans === undefined
                          ? 'bg-slate-800 text-slate-400'
                          : isCorrect
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-rose-500 text-white font-black'
                      }`}
                    >
                      {q.id}
                    </span>

                    <div className="flex-1">
                      <p className="font-semibold text-slate-200 line-clamp-1">{q.es}</p>
                      <p className="text-slate-400 line-clamp-1 mt-0.5">{q.hy}</p>
                    </div>

                    {ans !== undefined && (
                      <span className="text-[11px] font-bold">
                        {isCorrect ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
