import { useEffect, useState } from 'react';
import { TOTAL_QUESTIONS, isSilhouetteStage } from '../utils/game';

export default function QuizScreen({
  baseUrl,
  question,
  questionIndex,
  stage,
  questionInStage,
  score,
  answered,
  wasCorrect,
  selectedId,
  textAnswer,
  onSelect,
  onTextSubmit,
  onNext,
}) {
  const { pokemon, type, choices } = question;
  const isLastQuestion = questionIndex === TOTAL_QUESTIONS - 1;
  const isChoice = type === 'choice';
  const isSilhouette = isSilhouetteStage(stage);

  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue('');
  }, [questionIndex]);

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (answered || !inputValue.trim()) return;
    onTextSubmit(inputValue);
  };

  return (
    <section className="screen quiz-screen">
      <header className="quiz-header">
        <div className="stage-badge">
          {stage}단계 · {questionInStage}/3
          <span className="mode-tag">{isChoice ? '객관식' : '주관식'}</span>
        </div>
        <div className="progress-text">
          {questionIndex + 1} / {TOTAL_QUESTIONS} · 점수 {score}
        </div>
      </header>

      <div className="progress-bar" aria-hidden="true">
        <div
          className="progress-fill"
          style={{ width: `${((questionIndex + 1) / TOTAL_QUESTIONS) * 100}%` }}
        />
      </div>

      <div className="question-card">
        <p className="question-prompt">
          {isSilhouette
            ? '검은 실루엣만 보입니다. 포켓몬 이름을 맞춰보세요!'
            : isChoice
              ? '이 포켓몬의 이름은?'
              : '포켓몬 이름을 직접 입력하세요'}
        </p>
        <img
          className={`pokemon-image${isSilhouette ? ' silhouette' : ''}`}
          src={`${baseUrl}${pokemon.image}`}
          alt="포켓몬 이미지"
        />
      </div>

      {isChoice ? (
        <div className="choices" role="group" aria-label="답 선택">
          {choices.map((choice) => {
            let className = 'choice-btn';
            if (answered) {
              if (choice.id === pokemon.id) className += ' correct';
              else if (choice.id === selectedId) className += ' wrong';
            }

            return (
              <button
                key={choice.id}
                type="button"
                className={className}
                disabled={answered}
                onClick={() => onSelect(choice.id)}
              >
                {choice.nameKo}
              </button>
            );
          })}
        </div>
      ) : (
        <form className="text-answer-form" onSubmit={handleTextSubmit}>
          <input
            type="text"
            className={`text-answer-input${answered ? (wasCorrect ? ' correct' : ' wrong') : ''}`}
            placeholder="포켓몬 이름 입력"
            value={inputValue}
            disabled={answered}
            onChange={(e) => setInputValue(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {!answered && (
            <button type="submit" className="btn btn-primary" disabled={!inputValue.trim()}>
              정답 확인
            </button>
          )}
        </form>
      )}

      {answered && (
        <div className="feedback">
          <p className={wasCorrect ? 'feedback-correct' : 'feedback-wrong'}>
            {wasCorrect
              ? '정답입니다!'
              : isChoice
                ? `오답입니다. 정답은 ${pokemon.nameKo}입니다.`
                : `오답입니다. 정답은 ${pokemon.nameKo}입니다.${
                    textAnswer ? ` (입력: ${textAnswer})` : ''
                  }`}
          </p>
          <button type="button" className="btn btn-primary" onClick={onNext}>
            {isLastQuestion ? '결과 보기' : '다음 문제'}
          </button>
        </div>
      )}
    </section>
  );
}
