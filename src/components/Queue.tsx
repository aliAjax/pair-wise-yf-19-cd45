import type { IdentifyStatus, Specimen } from "../types";
import { IDENTIFY_LABEL, PRESS_LABEL, STAGE_LABEL } from "../types";
import { missingRequirements } from "../logic";

export type FilterKey = "all" | IdentifyStatus;

interface Props {
  specimens: Specimen[];
  filter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
  onOpen: (id: string) => void;
}

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "全部" },
  { key: "unidentified", label: "待鉴定" },
  { key: "passed", label: "鉴定通过" },
  { key: "failed", label: "鉴定未通过" },
];

function statusBadges(s: Specimen) {
  return (
    <div className="badges">
      <span className={`badge press-${s.press}`}>{PRESS_LABEL[s.press]}</span>
      <span className={`badge id-${s.identify}`}>
        {IDENTIFY_LABEL[s.identify]}
      </span>
      <span className={`badge stage-${s.stage}`}>{STAGE_LABEL[s.stage]}</span>
    </div>
  );
}

export default function Queue({
  specimens,
  filter,
  onFilterChange,
  onOpen,
}: Props) {
  const counts = FILTERS.map((f) => ({
    ...f,
    count:
      f.key === "all"
        ? specimens.length
        : specimens.filter((s) => s.identify === f.key).length,
  }));

  const list =
    filter === "all"
      ? specimens
      : specimens.filter((s) => s.identify === filter);

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>入库队列</p>
          <h2>待办标本（{list.length}）</h2>
        </div>
        <div className="chips filter-chips">
          {counts.map((f) => (
            <button
              key={f.key}
              className={filter === f.key ? "chip active" : "chip"}
              onClick={() => onFilterChange(f.key)}
            >
              {f.label}
              <em>{f.count}</em>
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="empty">当前筛选下没有标本记录。</p>
      ) : (
        <div className="queue">
          {list.map((s) => {
            const missing = missingRequirements(s);
            return (
              <article
                key={s.id}
                className={s.stage === "stored" ? "queue-row stored" : "queue-row"}
              >
                <div className="queue-main">
                  <h3>
                    {s.collectionNo}
                    <small>{s.species}</small>
                  </h3>
                  {statusBadges(s)}
                  <p className="queue-meta">
                    {s.location}
                    {s.altitude ? ` · ${s.altitude}` : ""} · 采集人 {s.collector}
                  </p>
                  {s.stage === "stored" ? (
                    <p className="queue-note ok">已上柜：{s.locationCode}</p>
                  ) : missing.length > 0 ? (
                    <p className="queue-note wait">
                      待处理 · 缺项：{missing.join("、")}
                    </p>
                  ) : (
                    <p className="queue-note ready">
                      条件齐备，可分配柜位办理入库
                    </p>
                  )}
                </div>
                <button className="ghost" onClick={() => onOpen(s.id)}>
                  打开详情
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
