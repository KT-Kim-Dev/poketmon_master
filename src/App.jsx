import { useState } from 'react';
import { usePokemonData } from './hooks/usePokemonData';
import { createQuestions, getStageInfo, isCorrectAnswer } from './utils/game';
import StartScreen from './components/StartScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';

export default function App() {
  const { pokemon, error, loading, baseUrl } = usePokemonData();
  const [phase, setPhase] = useState('start'); // start | playing | result
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [wasCorrect, setWasCorrect] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [nickname, setNickname] = useState('');

  const resetQuestionState = () => {
    setAnswered(false);
    setSelectedId(null);
    setTextAnswer('');
    setWasCorrect(false);
    setTimedOut(false);
  };

  const startGame = (playerNickname = '') => {
    setNickname(playerNickname);
    setQuestions(createQuestions(pokemon));
    setQuestionIndex(0);
    setScore(0);
    resetQuestionState();
    setPhase('playing');
  };

  const handleRestart = () => {
    setPhase('start');
  };

  const recordAnswer = (correct) => {
    setAnswered(true);
    setWasCorrect(correct);
    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleSelect = (choiceId) => {
    if (answered) return;
    const correctId = questions[questionIndex].pokemon.id;
    setSelectedId(choiceId);
    recordAnswer(choiceId === correctId);
  };

  const handleTextSubmit = (input) => {
    if (answered) return;
    const correct = isCorrectAnswer(input, questions[questionIndex].pokemon);
    setTextAnswer(input.trim());
    recordAnswer(correct);
  };

  const handleTimeUp = () => {
    if (answered) return;
    setTimedOut(true);
    recordAnswer(false);
  };

  const handleNext = () => {
    if (questionIndex + 1 >= questions.length) {
      setPhase('result');
      return;
    }
    setQuestionIndex((prev) => prev + 1);
    resetQuestionState();
  };

  if (loading) {
    return (
      <main className="app">
        <p className="loading-text">데이터를 불러오는 중...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app">
        <div className="error">
          <p>⚠️ {error}</p>
          <p>
            먼저 <code>npm run fetch-data</code> 를 실행해 데이터를 생성했는지 확인하세요.
          </p>
        </div>
      </main>
    );
  }

  const stageInfo = phase === 'playing' ? getStageInfo(questionIndex) : null;

  return (
    <main className="app">
      {phase === 'start' && (
        <StartScreen initialNickname={nickname} onStart={startGame} />
      )}

      {phase === 'playing' && questions.length > 0 && (
        <QuizScreen
          key={questionIndex}
          baseUrl={baseUrl}
          question={questions[questionIndex]}
          questionIndex={questionIndex}
          stage={stageInfo.stage}
          questionInStage={stageInfo.questionInStage}
          score={score}
          answered={answered}
          wasCorrect={wasCorrect}
          timedOut={timedOut}
          selectedId={selectedId}
          textAnswer={textAnswer}
          onSelect={handleSelect}
          onTextSubmit={handleTextSubmit}
          onTimeUp={handleTimeUp}
          onNext={handleNext}
        />
      )}

      {phase === 'result' && (
        <ResultScreen score={score} nickname={nickname} onRestart={handleRestart} />
      )}
    </main>
  );
}
