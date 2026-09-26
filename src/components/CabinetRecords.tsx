import type { Specimen } from "../types";
import { formatTime, occupiedCabinets } from "../lib/utils";

export function CabinetRecords({
  specimens,
  onOpen,
}: {
  specimens: Specimen[];
  onOpen: (id: string) => void;
}) {
  const stored = occupiedCabinets(specimens);

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>馆藏柜位记录</p>
          <h2>已占用柜位</h2>
        </div>
        <span className="count-pill">{stored.length} 个</span>
      </div>
      {stored.length === 0 ? (
        <p className="empty-hint">
          尚无柜位被占用；条件齐备的标本可在详情中分配柜位。
        </p>
      ) : (
        <div className="cabinet-grid">
          {stored.map((s) => (
            <button
              key={s.id}
              className="cabinet-cell"
              onClick={() => onOpen(s.id)}
              title="打开标本详情"
            >
              <b>{s.cabinet}</b>
              <span>{s.code}</span>
              <small>{s.species}</small>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export function LocationCard({ specimens }: { specimens: Specimen[] }) {
  // 按采集地点归并，概览各采集点的标本情况
  const groups = new Map<string, Specimen[]>();
  for (const s of specimens) {
    const key = s.location.trim() || "（未填写采集地点）";
    const arr = groups.get(key);
    if (arr) arr.push(s);
    else groups.set(key, [s]);
  }
  const entries = [...groups.entries()].sort(
    (a, b) => b[1].length - a[1].length
  );

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>采集地点信息卡</p>
          <h2>采集点分布</h2>
        </div>
        <span className="count-pill">{entries.length} 处</span>
      </div>
      <div className="location-list">
        {entries.map(([place, list]) => {
          const elevations = [...new Set(list.map((s) => s.elevation).filter(Boolean))];
          const habitats = [...new Set(list.map((s) => s.habitat).filter(Boolean))];
          const collectors = [...new Set(list.map((s) => s.collector).filter(Boolean))];
          const latest = list
            .map((s) => s.updatedAt)
            .sort()
            .reverse()[0];
          return (
            <article key={place} className="location-card">
              <h3>{place}</h3>
              <dl>
                {elevations.length > 0 && (
                  <div>
                    <dt>海拔</dt>
                    <dd>{elevations.join("、")}</dd>
                  </div>
                )}
                {habitats.length > 0 && (
                  <div>
                    <dt>生境</dt>
                    <dd>{habitats.join("；")}</dd>
                  </div>
                )}
                {collectors.length > 0 && (
                  <div>
                    <dt>采集人</dt>
                    <dd>{collectors.join("、")}</dd>
                  </div>
                )}
              </dl>
              <footer>
                <span>{list.length} 份标本</span>
                <span>最近更新 {formatTime(latest)}</span>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
