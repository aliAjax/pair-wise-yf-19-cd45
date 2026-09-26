import { useMemo, useState } from "react";
import type { IdenStatus, Specimen } from "../types";
import { IDEN_LABEL } from "../types";
import { canAssign, missingConditions, stageOf } from "../lib/utils";
import { IdenBadge, PressBadge, StageBadge } from "./StatusUI";

type IdenFilter = "all" | IdenStatus;

const FILTERS: { value: IdenFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "pending", label: IDEN_LABEL.pending },
  { value: "passed", label: IDEN_LABEL.passed },
  { value: "rejected", label: IDEN_LABEL.rejected },
];

export function Queue({
  specimens,
  onOpen,
}: {
  specimens: Specimen[];
  onOpen: (id: string) => void;
}) {
  const [filter, setFilter] = useState<IdenFilter>("all");
  const [keyword, setKeyword] = useState("");

  const counts = useMemo(() => {
    const c: Record<IdenFilter, number> = {
      all: specimens.length,
      pending: 0,
      passed: 0,
      rejected: 0,
    };
    for (const s of specimens) c[s.iden] += 1;
    return c;
  }, [specimens]);

  const list = useMemo(() => {
    const kw = keyword.trim().toUpperCase();
    return specimens.filter((s) => {
      if (filter !== "all" && s.iden !== filter) return false;
      if (!kw) return true;
      return (
        s.code.toUpperCase().includes(kw) ||
        s.species.toUpperCase().includes(kw) ||
        s.location.toUpperCase().includes(kw) ||
        s.collector.toUpperCase().includes(kw)
      );
    });
  }, [specimens, filter, keyword]);

  return (
    <section className="panel queue-panel">
      <div className="heading">
        <div>
          <p>入库队列</p>
          <h2>待办标本</h2>
        </div>
      </div>

      <div className="chips" role="group" aria-label="按鉴定状态筛选">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={filter === f.value ? "chip active" : "chip"}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            <em>{counts[f.value]}</em>
          </button>
        ))}
      </div>

      <input
        className="queue-search"
        placeholder="搜索采集号 / 物种 / 地点 / 采集人"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <div className="queue-list">
        {list.length === 0 && (
          <p className="empty-hint">当前筛选下没有标本记录</p>
        )}
        {list.map((s) => {
          const stage = stageOf(s);
          const missing = missingConditions(s);
          return (
            <article
              key={s.id}
              className={`queue-card ${stage}`}
              onClick={() => onOpen(s.id)}
            >
              <div className="queue-card-head">
                <h3>{s.code}</h3>
                <StageBadge stage={stage} />
              </div>
              <p className="queue-species">{s.species}</p>
              <p className="queue-meta">
                {s.location || "（未填地点）"}
                {s.elevation ? ` · ${s.elevation}` : ""}
                {s.collector ? ` · 采集 ${s.collector}` : ""}
              </p>
              <div className="queue-tags">
                <PressBadge value={s.press} />
                <IdenBadge value={s.iden} />
                {s.cabinet && <span className="cabinet-tag">柜 {s.cabinet}</span>}
              </div>
              {!s.cabinet && !canAssign(s) && (
                <p className="missing-hint">
                  待处理 · 缺项：{missing.join("、")}
                </p>
              )}
              {!s.cabinet && canAssign(s) && (
                <p className="ready-hint">条件齐备，可办理柜位上柜</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
