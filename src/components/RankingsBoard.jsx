import { useRankings } from '../hooks/useRankings';

export default function RankingsBoard({ compact = false, refreshKey = 0 }) {
  const { rankings, loading, error, available } = useRankings(true, refreshKey);

  if (!available) {
    return (
      <div className={`rankings-board${compact ? ' compact' : ''}`}>
        <h3>TOP 10 랭킹</h3>
        <p className="rankings-unavailable">
          랭킹 URL이 설정되지 않았습니다. GitHub Variables에{' '}
          <code>VITE_WORKER_URL</code> 또는 <code>VITE_RANKINGS_RAW_URL</code>을 추가하세요.
        </p>
      </div>
    );
  }

  return (
    <div className={`rankings-board${compact ? ' compact' : ''}`}>
      <h3>TOP 10 랭킹</h3>

      {loading && <p className="rankings-status">랭킹을 불러오는 중...</p>}
      {error && <p className="rankings-error">{error}</p>}

      {!loading && !error && rankings.length === 0 && (
        <p className="rankings-status">아직 등록된 기록이 없습니다.</p>
      )}

      {!loading && !error && rankings.length > 0 && (
        <table className="rankings-table">
          <thead>
            <tr>
              <th>순위</th>
              <th>닉네임</th>
              <th>점수</th>
              <th>등급</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((entry, index) => (
              <tr key={`${entry.nickname}-${entry.recordedAt}-${index}`}>
                <td>{index + 1}</td>
                <td>{entry.nickname}</td>
                <td>{entry.score}</td>
                <td>{entry.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
