import { useState } from 'react';
import { TOTAL_QUESTIONS, getGrade } from '../utils/game';
import { submitRanking, isRankingAvailable, canSubmitRanking } from '../api/rankings';
import RankingsBoard from './RankingsBoard';

export default function ResultScreen({ score, nickname, onRestart }) {
  const percent = Math.round((score / TOTAL_QUESTIONS) * 100);
  const grade = getGrade(score);
  const displayName = nickname || '게스트';
  const rankingAvailable = isRankingAvailable();
  const submitAvailable = canSubmitRanking();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [rankingsVersion, setRankingsVersion] = useState(0);

  const handleSubmitRanking = async () => {
    if (!nickname || submitting || submitted) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitRanking({
        nickname,
        score,
        grade: grade.label,
      });
      setSubmitted(true);
      setRankingsVersion((v) => v + 1);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="screen result-screen">
      <h2>게임 종료</h2>
      <p className="result-player">{displayName}님의 결과</p>

      <div className={`grade-badge grade-${grade.key}`}>{grade.label}</div>

      <p className="result-score">
        <span className="score-value">{score}</span>
        <span className="score-total"> / {TOTAL_QUESTIONS}점</span>
      </p>
      <p className="result-percent">정답률 {percent}%</p>

      {nickname && submitAvailable && (
        <div className="ranking-submit">
          {submitted ? (
            <p className="ranking-success">랭킹에 등록되었습니다!</p>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={submitting}
              onClick={handleSubmitRanking}
            >
              {submitting ? '등록 중...' : '랭킹 등록'}
            </button>
          )}
          {submitError && <p className="rankings-error">{submitError}</p>}
        </div>
      )}

      {nickname && rankingAvailable && !submitAvailable && (
        <p className="result-hint">
          랭킹 조회만 가능합니다. 등록하려면 Worker를 배포하고 <code>VITE_WORKER_URL</code>을
          설정하세요.
        </p>
      )}

      {!nickname && rankingAvailable && (
        <p className="result-hint">닉네임을 입력하면 랭킹에 등록할 수 있습니다.</p>
      )}

      <RankingsBoard compact refreshKey={rankingsVersion} />

      <button type="button" className="btn btn-primary" onClick={onRestart}>
        다시 하기
      </button>
    </section>
  );
}
