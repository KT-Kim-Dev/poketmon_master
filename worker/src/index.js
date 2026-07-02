/**
 * Cloudflare Worker — TOP10 랭킹 API
 *
 * GET  /rankings       랭킹 조회
 * POST /rankings       랭킹 등록 { nickname, score, grade }
 *
 * GitHub Contents API로 data/rankings.json 을 read/write 합니다.
 * GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO 가 없으면
 * wrangler dev 로컬 테스트용 in-memory 저장소를 사용합니다.
 */

const RANKINGS_PATH = 'data/rankings.json';
const MAX_RANKINGS = 10;
const MAX_RETRIES = 3;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/** wrangler dev 재시작 전까지 유지되는 로컬 fallback 저장소 */
let memoryRankings = [];

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return json(null, 204);
    }

    const url = new URL(request.url);

    if (url.pathname === '/rankings') {
      if (request.method === 'GET') {
        return handleGetRankings(env);
      }
      if (request.method === 'POST') {
        return handlePostRanking(request, env);
      }
    }

    return json({ error: 'Not Found' }, 404);
  },
};

async function handleGetRankings(env) {
  try {
    const rankings = await loadRankings(env);
    return json(rankings);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

async function handlePostRanking(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const nickname = typeof body.nickname === 'string' ? body.nickname.trim().slice(0, 12) : '';
  const score = Number(body.score);
  const grade = typeof body.grade === 'string' ? body.grade.trim().slice(0, 20) : '';

  if (!nickname) {
    return json({ error: 'nickname is required' }, 400);
  }
  if (!Number.isInteger(score) || score < 0 || score > 30) {
    return json({ error: 'score must be an integer between 0 and 30' }, 400);
  }
  if (!grade) {
    return json({ error: 'grade is required' }, 400);
  }

  const entry = {
    nickname,
    score,
    grade,
    recordedAt: new Date().toISOString(),
  };

  try {
    const rankings = await addRanking(env, entry);
    return json({ ok: true, rankings }, 201);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

function hasGitHubConfig(env) {
  return Boolean(env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPO);
}

async function loadRankings(env) {
  if (!hasGitHubConfig(env)) {
    return sortAndTrim([...memoryRankings]);
  }

  const { data } = await fetchFromGitHub(env);
  return sortAndTrim(Array.isArray(data) ? data : []);
}

async function addRanking(env, entry) {
  if (!hasGitHubConfig(env)) {
    memoryRankings = sortAndTrim([...memoryRankings, entry]);
    return memoryRankings;
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const { data, sha } = await fetchFromGitHub(env);
    const current = Array.isArray(data) ? data : [];
    const updated = sortAndTrim([...current, entry]);

    try {
      await writeToGitHub(env, updated, sha);
      return updated;
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw err;
      // SHA 충돌(동시 등록) 시 재시도
    }
  }

  throw new Error('Failed to update rankings after retries');
}

async function fetchFromGitHub(env) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${RANKINGS_PATH}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'pokemon-master-worker',
    },
  });

  if (res.status === 404) {
    return { data: [], sha: null };
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub read failed (${res.status}): ${text}`);
  }

  const file = await res.json();
  const decoded = JSON.parse(base64ToUtf8(file.content.replace(/\n/g, '')));
  return { data: decoded, sha: file.sha };
}

async function writeToGitHub(env, data, sha) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${RANKINGS_PATH}`;
  const content = utf8ToBase64(JSON.stringify(data, null, 2));

  const body = {
    message: `Update rankings (${new Date().toISOString()})`,
    content,
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'pokemon-master-worker',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub write failed (${res.status}): ${text}`);
  }
}

function sortAndTrim(rankings) {
  return rankings
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.recordedAt) - new Date(b.recordedAt);
    })
    .slice(0, MAX_RANKINGS);
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToUtf8(base64) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function json(data, status = 200) {
  return new Response(data ? JSON.stringify(data) : null, {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}
