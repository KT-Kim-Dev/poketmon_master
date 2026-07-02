/**
 * PokeAPI에서 1~9세대(1~1025번) 포켓몬 데이터를 수집하는 스크립트.
 *
 * 생성물:
 *  - public/data/pokemon.json      : 게임에서 사용할 포켓몬 목록 (id, 한글/영문 이름, 이미지 경로)
 *  - public/data/images/{id}.png   : 포켓몬 공식 아트워크 이미지
 *  - data/korean_names.json        : { id: 한글이름 } 매핑 (참고/재사용용)
 *
 * 사용법:
 *  npm run fetch-data
 *
 * Node 18+ 의 내장 fetch 를 사용합니다.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const FIRST_ID = 1;
const LAST_ID = 1025; // 9세대(페차런트)까지
const API_BASE = 'https://pokeapi.co/api/v2';

const OUT_DATA_DIR = resolve(ROOT, 'public/data');
const OUT_IMAGE_DIR = resolve(OUT_DATA_DIR, 'images');
const OUT_POKEMON_JSON = resolve(OUT_DATA_DIR, 'pokemon.json');
const OUT_KOREAN_NAMES = resolve(ROOT, 'data/korean_names.json');

// PokeAPI 서버에 과도한 부하를 주지 않도록 요청 사이에 짧은 지연을 둡니다.
const REQUEST_DELAY_MS = 200;
const MAX_RETRIES = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 실패 시 지수 백오프로 재시도하는 fetch 래퍼.
 */
async function fetchWithRetry(url, { asBuffer = false } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
      return asBuffer ? Buffer.from(await res.arrayBuffer()) : await res.json();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        const backoff = REQUEST_DELAY_MS * 2 ** attempt;
        console.warn(`  재시도 ${attempt}/${MAX_RETRIES - 1} (${backoff}ms 후): ${err.message}`);
        await sleep(backoff);
      }
    }
  }
  throw lastError;
}

/**
 * 특정 id 포켓몬의 이름/이미지 정보를 수집하고 이미지를 저장합니다.
 */
async function collectPokemon(id) {
  // 1) species: 한글 이름
  const species = await fetchWithRetry(`${API_BASE}/pokemon-species/${id}`);
  const koEntry = species.names.find((n) => n.language.name === 'ko');
  const enEntry = species.names.find((n) => n.language.name === 'en');
  const nameKo = koEntry?.name ?? enEntry?.name ?? `#${id}`;
  const nameEn = enEntry?.name ?? `#${id}`;

  // 2) pokemon: 공식 아트워크 이미지 URL
  const pokemon = await fetchWithRetry(`${API_BASE}/pokemon/${id}`);
  const imageUrl =
    pokemon.sprites?.other?.['official-artwork']?.front_default ??
    pokemon.sprites?.front_default;

  if (!imageUrl) throw new Error(`이미지 URL을 찾을 수 없습니다 (id=${id})`);

  // 3) 이미지 다운로드 후 저장
  const imageBuffer = await fetchWithRetry(imageUrl, { asBuffer: true });
  const imageFileName = `${id}.png`;
  await writeFile(resolve(OUT_IMAGE_DIR, imageFileName), imageBuffer);

  return {
    id,
    nameKo,
    nameEn,
    image: `data/images/${imageFileName}`,
  };
}

async function loadExistingData() {
  const pokemonById = new Map();
  const koreanNames = {};

  try {
    const raw = await readFile(OUT_POKEMON_JSON, 'utf-8');
    const list = JSON.parse(raw);
    for (const entry of list) {
      pokemonById.set(entry.id, entry);
      koreanNames[entry.id] = entry.nameKo;
    }
  } catch {
    // 최초 실행 시 파일이 없을 수 있음
  }

  return { pokemonById, koreanNames };
}

async function main() {
  console.log(`포켓몬 데이터 수집 시작 (${FIRST_ID}~${LAST_ID})`);

  await mkdir(OUT_IMAGE_DIR, { recursive: true });
  await mkdir(dirname(OUT_KOREAN_NAMES), { recursive: true });

  const { pokemonById, koreanNames } = await loadExistingData();
  const failed = [];
  let fetchedCount = 0;
  let skippedCount = 0;

  for (let id = FIRST_ID; id <= LAST_ID; id += 1) {
    const imagePath = resolve(OUT_IMAGE_DIR, `${id}.png`);
    const hasImage = await readFile(imagePath).then(() => true).catch(() => false);

    if (pokemonById.has(id) && hasImage) {
      skippedCount += 1;
      continue;
    }

    try {
      const entry = await collectPokemon(id);
      pokemonById.set(id, entry);
      koreanNames[id] = entry.nameKo;
      fetchedCount += 1;
      console.log(`  [${id}/${LAST_ID}] ${entry.nameKo} (${entry.nameEn}) 완료`);
    } catch (err) {
      console.error(`  [${id}/${LAST_ID}] 실패: ${err.message}`);
      failed.push(id);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  const pokemonList = [...pokemonById.values()].sort((a, b) => a.id - b.id);

  await writeFile(OUT_POKEMON_JSON, `${JSON.stringify(pokemonList, null, 2)}\n`, 'utf-8');
  await writeFile(OUT_KOREAN_NAMES, `${JSON.stringify(koreanNames, null, 2)}\n`, 'utf-8');

  console.log('\n수집 완료');
  console.log(`  신규 수집: ${fetchedCount}마리`);
  console.log(`  기존 유지: ${skippedCount}마리`);
  console.log(`  총 포켓몬: ${pokemonList.length}마리`);
  console.log(`  pokemon.json  -> ${OUT_POKEMON_JSON}`);
  console.log(`  korean_names  -> ${OUT_KOREAN_NAMES}`);
  console.log(`  images        -> ${OUT_IMAGE_DIR}`);

  if (failed.length > 0) {
    console.warn(`\n실패한 id: ${failed.join(', ')}`);
    console.warn('네트워크 상태를 확인한 뒤 스크립트를 다시 실행하세요.');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('스크립트 실행 중 오류가 발생했습니다:', err);
  process.exit(1);
});
