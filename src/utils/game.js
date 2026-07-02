export const QUESTIONS_PER_STAGE = 5;
export const TOTAL_STAGES = 10;
export const TOTAL_QUESTIONS = TOTAL_STAGES * QUESTIONS_PER_STAGE;
export const CHOICES_COUNT = 4;
export const SILHOUETTE_MIN_STAGE = 8;
export const STAGE_TIME_MAX = 10; // 1단계 (초)
export const STAGE_TIME_MIN = 5; // 10단계 (초)

/** Fisher-Yates 셔플 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 1~1025 중 중복 없이 count개 랜덤 선택 */
export function pickRandomPokemon(allPokemon, count) {
  return shuffle(allPokemon).slice(0, count);
}

/** 정답 1개 + 오답 3개 4지선다 선택지 생성 */
export function buildChoices(correctPokemon, allPokemon) {
  const wrongPool = allPokemon.filter((p) => p.id !== correctPokemon.id);
  const wrongChoices = shuffle(wrongPool).slice(0, CHOICES_COUNT - 1);
  return shuffle([correctPokemon, ...wrongChoices]);
}

/** questionIndex(0-based) → { stage, questionInStage } */
export function getStageInfo(questionIndex) {
  return {
    stage: Math.floor(questionIndex / QUESTIONS_PER_STAGE) + 1,
    questionInStage: (questionIndex % QUESTIONS_PER_STAGE) + 1,
  };
}

/** 8단계 이상: 포켓몬 이미지 실루엣(검정) 표시 */
export function isSilhouetteStage(stage) {
  return stage >= SILHOUETTE_MIN_STAGE;
}

/** questionIndex 기준 실루엣 여부 (8단계 = index 35부터) */
export function isSilhouetteQuestion(questionIndex) {
  return isSilhouetteStage(getStageInfo(questionIndex).stage);
}

/** 단계별 제한 시간 (1단계 10초 → 10단계 5초, 선형 보간) */
export function getStageTimeLimit(stage) {
  if (TOTAL_STAGES <= 1) return STAGE_TIME_MAX;
  const progress = (stage - 1) / (TOTAL_STAGES - 1);
  return Math.round(STAGE_TIME_MAX - (STAGE_TIME_MAX - STAGE_TIME_MIN) * progress);
}

/** 전체 문제 목록 생성 */
export function createQuestions(allPokemon) {
  const selected = pickRandomPokemon(allPokemon, TOTAL_QUESTIONS);
  return selected.map((pokemon, index) => {
    const isSilhouette = isSilhouetteQuestion(index);
    return {
      pokemon,
      type: 'choice',
      isSilhouette,
      choices: buildChoices(pokemon, allPokemon),
    };
  });
}

/** README 등급 기준에 따른 등급 판정 */
export function getGrade(score) {
  if (score >= 47) return { label: '포켓몬 마스터', key: 'master' };
  if (score >= 33) return { label: '포켓몬 트레이너', key: 'trainer' };
  if (score >= 17) return { label: '지식인', key: 'scholar' };
  return { label: '일반인', key: 'ordinary' };
}

export const GRADE_TABLE = [
  { range: '47점 이상', label: '포켓몬 마스터' },
  { range: '33~46점', label: '포켓몬 트레이너' },
  { range: '17~32점', label: '지식인' },
  { range: '17점 미만', label: '일반인' },
];

/** 닉네임 정규화 (공백 제거, 최대 12자) */
export function normalizeNickname(value) {
  return value.trim().slice(0, 12);
}

/** 주관식 답안 정규화 (공백 제거, 소문자) */
export function normalizeAnswer(value) {
  return value.trim().replace(/\s+/g, '').toLowerCase();
}

/** 주관식 정답 판정 (한글명 또는 영문명 허용) */
export function isCorrectAnswer(input, pokemon) {
  const normalized = normalizeAnswer(input);
  if (!normalized) return false;
  return (
    normalized === normalizeAnswer(pokemon.nameKo) ||
    normalized === normalizeAnswer(pokemon.nameEn)
  );
}
