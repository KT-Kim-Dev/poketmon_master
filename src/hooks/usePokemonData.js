import { useEffect, useState } from 'react';

export function usePokemonData() {
  const [pokemon, setPokemon] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const baseUrl = import.meta.env.BASE_URL;

  useEffect(() => {
    fetch(`${baseUrl}data/pokemon.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`데이터를 불러오지 못했습니다 (HTTP ${res.status})`);
        return res.json();
      })
      .then((data) => setPokemon(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [baseUrl]);

  return { pokemon, error, loading, baseUrl };
}
