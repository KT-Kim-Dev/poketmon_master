const WORKER_URL = import.meta.env.VITE_WORKER_URL?.replace(/\/$/, '');
const RANKINGS_RAW_URL = import.meta.env.VITE_RANKINGS_RAW_URL?.replace(/\/$/, '');

/** 랭킹 조회 가능 여부 (Worker 또는 GitHub raw URL) */
export function isRankingAvailable() {
  return Boolean(WORKER_URL || RANKINGS_RAW_URL);
}

/** 랭킹 등록 가능 여부 (Worker POST 필요) */
export function canSubmitRanking() {
  return Boolean(WORKER_URL);
}

export async function fetchRankings() {
  if (WORKER_URL) {
    const res = await fetch(`${WORKER_URL}/rankings`);
    if (!res.ok) {
      throw new Error('랭킹을 불러오지 못했습니다.');
    }
    return res.json();
  }

  if (RANKINGS_RAW_URL) {
    const res = await fetch(RANKINGS_RAW_URL);
    if (!res.ok) {
      throw new Error('랭킹을 불러오지 못했습니다.');
    }
    return res.json();
  }

  throw new Error('VITE_WORKER_URL 또는 VITE_RANKINGS_RAW_URL이 설정되지 않았습니다.');
}

export async function submitRanking({ nickname, score, grade }) {
  if (!WORKER_URL) {
    throw new Error('VITE_WORKER_URL이 설정되지 않았습니다. 랭킹 등록은 Worker 배포 후 가능합니다.');
  }

  const res = await fetch(`${WORKER_URL}/rankings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, score, grade }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || '랭킹 등록에 실패했습니다.');
  }

  return data;
}
