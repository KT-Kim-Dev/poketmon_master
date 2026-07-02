import { useEffect, useRef, useState } from 'react';
import { TOTAL_QUESTIONS, QUESTIONS_PER_STAGE, getStageTimeLimit } from '../utils/game';

export default function QuizScreen({
  baseUrl,
  question,
  questionIndex,
  stage,
  questionInStage,
  score,
  answered,
  wasCorrect,
  timedOut,
  selectedId,
  textAnswer,
  onSelect,
  onTextSubmit,
  onTimeUp,
  onNext,
}) {
  const { pokemon, type, choices, isSilhouette } = question;
  const isLastQuestion = questionIndex === TOTAL_QUESTIONS - 1;
  const isChoice = type === 'choice';
  const timeLimit = getStageTimeLimit(stage);

  const [inputValue, setInputValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  // 항상 최신 값을 참조하는 refs (stale closure 방지)
  const answeredRef = useRef(false);
  answeredRef.current = answered;

  const firedRef = useRef(false);

  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  // 문제가 바뀔 때 입력값 초기화
  useEffect(() => {
    setInputValue('');
  }, [questionIndex]);

  // 타이머: questionIndex 변경 시에만 완전히 초기화
  // - Date.now() 기반으로 드리프트 없이 정확하게 계산 (Bug 2 fix)
  // - answered는 dep에서 제외 → 답변 시 타이머 재시작 없음 (Bug 1 fix)
  // - setState 업데이터 안에서 onTimeUp 호출하지 않음 (Bug 1 fix)
  useEffect(() => {
    firedRef.current = false;
    setTimeLeft(timeLimit);

    const endTime = Date.now() + timeLimit * 1000;
    let timerId;

    const tick = () => {
      // 이미 답변했으면 타이머 중단 (ref로 최신 answered 확인)
      if (answeredRef.current) return;

      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (!firedRef.current) {
          firedRef.current = true;
          onTimeUpRef.current();
        }
        return;
      }

      timerId = setTimeout(tick, 200); // 200ms 간격으로 정확하게 갱신
    };

    timerId = setTimeout(tick, 200);

    return () => clearTimeout(timerId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIndex, timeLimit]); // answered 제외: 답변 시 타이머 재시작 방지

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (answered || !inputValue.trim()) return;
    onTextSubmit(inputValue);
  };

  const preventImageDrag = (e) => {
    e.preventDefault();
  };

  const timerRatio = timeLimit > 0 ? timeLeft / timeLimit : 0;
  const timerUrgent = timeLeft <= 3 && !answered;

  return (
    <section className="screen quiz-screen">
      <header className="quiz-header">
        <div className="stage-badge">
          {stage}단계 · {questionInStage}/{QUESTIONS_PER_STAGE}
          <span className="mode-tag">{isChoice ? '객관식' : '주관식'}</span>
          {isSilhouette && <span className="mode-tag silhouette-tag">실루엣</span>}
        </div>
        <div className={`timer-display${timerUrgent ? ' urgent' : ''}`}>
          ⏱ {timeLeft}초
        </div>
      </header>

      <div className="timer-bar" aria-hidden="true">
        <div
          className={`timer-fill${timerUrgent ? ' urgent' : ''}`}
          style={{ width: `${timerRatio * 100}%` }}
        />
      </div>

      <div className="progress-text">
        {questionIndex + 1} / {TOTAL_QUESTIONS} · 점수 {score}
      </div>

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
        <div
          className={`pokemon-image-wrap${isSilhouette ? ' silhouette-wrap' : ''}`}
          onDragStart={preventImageDrag}
        >
          <img
            className={`pokemon-image${isSilhouette ? ' silhouette' : ''}`}
            src={`${baseUrl}${pokemon.image}`}
            alt="포켓몬 이미지"
            draggable={false}
            onDragStart={preventImageDrag}
            onContextMenu={preventImageDrag}
            style={
              isSilhouette
                ? { filter: 'grayscale(100%) brightness(0) contrast(1.25)' }
                : undefined
            }
          />
        </div>
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
              : timedOut
                ? `시간 초과! 정답은 ${pokemon.nameKo}입니다.`
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
