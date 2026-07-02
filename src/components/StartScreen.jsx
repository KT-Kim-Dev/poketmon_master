import { useState } from 'react';
import {
  TOTAL_QUESTIONS,
  TOTAL_STAGES,
  QUESTIONS_PER_STAGE,
  MULTIPLE_CHOICE_MAX_STAGE,
  GRADE_TABLE,
  normalizeNickname,
} from '../utils/game';
import RankingsBoard from './RankingsBoard';

export default function StartScreen({ initialNickname = '', onStart }) {
  const [nickname, setNickname] = useState(initialNickname);

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart(normalizeNickname(nickname));
  };

  return (
    <section className="screen start-screen">
      <h1>포켓몬 마스터</h1>
      <p className="subtitle">관동지방 포켓몬 이름 맞추기</p>

      <div className="rules">
        <p>
          <strong>{TOTAL_STAGES}단계</strong> × <strong>{QUESTIONS_PER_STAGE}문제</strong> = 총{' '}
          <strong>{TOTAL_QUESTIONS}문제</strong>
        </p>
        <p>
          <strong>1~{MULTIPLE_CHOICE_MAX_STAGE}단계</strong>: 4지선다 객관식
        </p>
        <p>
          <strong>{MULTIPLE_CHOICE_MAX_STAGE + 1}~{TOTAL_STAGES}단계</strong>: 이름 직접 입력
          (주관식)
        </p>
        <p>정답 1문제당 1점 · 최고 {TOTAL_QUESTIONS}점</p>
      </div>

      <table className="grade-table">
        <caption>등급 기준</caption>
        <thead>
          <tr>
            <th>점수</th>
            <th>등급</th>
          </tr>
        </thead>
        <tbody>
          {GRADE_TABLE.map((row) => (
            <tr key={row.label}>
              <td>{row.range}</td>
              <td>{row.label}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="start-form" onSubmit={handleSubmit}>
        <label className="nickname-label" htmlFor="nickname">
          닉네임 <span className="optional">(선택, 랭킹 등록용)</span>
        </label>
        <input
          id="nickname"
          type="text"
          className="nickname-input"
          placeholder="예: 피카츄마스터"
          maxLength={12}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <button type="submit" className="btn btn-primary">
          게임 시작
        </button>
      </form>

      <RankingsBoard compact />
    </section>
  );
}
