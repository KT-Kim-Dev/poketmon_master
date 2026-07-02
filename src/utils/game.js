export const TOTAL_QUESTIONS = 30;
export const QUESTIONS_PER_STAGE = 3;
export const TOTAL_STAGES = TOTAL_QUESTIONS / QUESTIONS_PER_STAGE;
export const CHOICES_COUNT = 4;
export const MULTIPLE_CHOICE_MAX_STAGE = 4;
export const SILHOUETTE_MIN_STAGE = 8;

/** Fisher-Yates 셔플 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 1~151 중 중복 없이 count개 랜덤 선택 */
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

/** 1~4단계: 객관식, 5~10단계: 주관식 */
export function getQuestionType(questionIndex) {
  const { stage } = getStageInfo(questionIndex);
  return stage <= MULTIPLE_CHOICE_MAX_STAGE ? 'choice' : 'text';
}

/** 전체 문제 목록 생성 */
export function createQuestions(allPokemon) {
  const selected = pickRandomPokemon(allPokemon, TOTAL_QUESTIONS);
  return selected.map((pokemon, index) => {
    const type = getQuestionType(index);
    return {
      pokemon,
      type,
      choices: type === 'choice' ? buildChoices(pokemon, allPokemon) : null,
    };
  });
}

/** README 등급 기준에 따른 등급 판정 */
export function getGrade(score) {
  if (score >= 28) return { label: '포켓몬 마스터', key: 'master' };
  if (score >= 20) return { label: '포켓몬 트레이너', key: 'trainer' };
  if (score >= 10) return { label: '지식인', key: 'scholar' };
  return { label: '일반인', key: 'ordinary' };
}

export const GRADE_TABLE = [
  { range: '28점 이상', label: '포켓몬 마스터' },
  { range: '20~27점', label: '포켓몬 트레이너' },
  { range: '10~19점', label: '지식인' },
  { range: '10점 미만', label: '일반인' },
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
