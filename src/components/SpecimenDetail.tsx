import { useEffect, useState } from "react";
import type { IdenStatus, PressStatus, Specimen } from "../types";
import type { OpResult } from "../lib/useSpecimenStore";
import {
  formatTime,
  missingConditions,
  normalizeCabinet,
  occupiedCabinets,
  stageOf,
} from "../lib/utils";
import { IdenBadge, PressBadge, Segmented, StageBadge } from "./StatusUI";

interface Actions {
  editField: (
    id: string,
    field:
      | "code"
      | "species"
      | "location"
      | "elevation"
      | "habitat"
      | "collector",
    value: string
  ) => OpResult;
  setPress: (id: string, v: PressStatus) => OpResult;
  setIden: (id: string, v: IdenStatus) => OpResult;
  assignCabinet: (id: string, cabinet: string) => OpResult;
  releaseCabinet: (id: string) => OpResult;
  removeSpecimen: (id: string) => OpResult;
}

function FieldEditor({
  label,
  value,
  required,
  placeholder,
  onSave,
}: {
  label: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  onSave: (v: string) => OpResult;
}) {
  const [draft, setDraft] = useState(value);
  const [err, setErr] = useState<string | null>(null);
  const changed = draft !== value;

  const save = () => {
    const r = onSave(draft);
    if (!r.ok) {
      setErr(r.error ?? "保存失败");
      return;
    }
    setErr(null);
  };

  return (
    <label className={`detail-field${required ? " required" : ""}`}>
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <div className="detail-field-row">
        <input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => {
            setDraft(e.target.value);
            setErr(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && changed) save();
          }}
        />
        <button disabled={!changed} onClick={save}>
          保存
        </button>
      </div>
      {err && <small className="inline-error">{err}</small>}
    </label>
  );
}

function ConfirmAction({
  idle,
  confirm,
  onConfirm,
  tone = "danger",
}: {
  idle: string;
  confirm: string;
  onConfirm: () => void;
  tone?: "danger" | "warn";
}) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      className={armed ? `confirm-armed ${tone}` : tone}
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
        } else {
          setArmed(true);
        }
      }}
      onBlur={() => setArmed(false)}
    >
      {armed ? confirm : idle}
    </button>
  );
}

export function SpecimenDetail({
  specimen: s,
  all,
  actions,
  onClose,
  onDeleted,
  notify,
}: {
  specimen: Specimen;
  all: Specimen[];
  actions: Actions;
  onClose: () => void;
  onDeleted: () => void;
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [cabinetInput, setCabinetInput] = useState(s.cabinet ?? "");
  const [cabinetError, setCabinetError] = useState<string | null>(null);

  useEffect(() => {
    setCabinetInput(s.cabinet ?? "");
    setCabinetError(null);
  }, [s.cabinet, s.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stage = stageOf(s);
  const missing = missingConditions(s);
  const taken = occupiedCabinets(all).filter((x) => x.id !== s.id);

  const run = (fn: () => OpResult, okMsg: string) => {
    const r = fn();
    if (r.ok) notify(okMsg, "ok");
    else notify(r.error ?? "操作失败", "err");
    return r;
  };

  const doAssign = () => {
    const r = actions.assignCabinet(s.id, cabinetInput);
    if (!r.ok) {
      setCabinetError(r.error ?? "分配失败");
      notify(r.error ?? "分配失败", "err");
      return;
    }
    setCabinetError(null);
    notify(
      s.cabinet
        ? `柜位已调整为 ${normalizeCabinet(cabinetInput)}`
        : `已分配柜位 ${normalizeCabinet(cabinetInput)}，标本入库`,
      "ok"
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`标本详情 ${s.code}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <div>
            <p>单份标本详情</p>
            <h2>{s.code}</h2>
            <div className="queue-tags">
              <StageBadge stage={stage} />
              <PressBadge value={s.press} />
              <IdenBadge value={s.iden} />
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="关闭详情">
            ×
          </button>
        </header>

        <div className="modal-body">
          <section>
            <h3>采集信息</h3>
            <div className="detail-grid">
              <FieldEditor
                label="采集号"
                required
                value={s.code}
                onSave={(v) => run(() => actions.editField(s.id, "code", v), "采集号已更新")}
              />
              <FieldEditor
                label="物种名称"
                required
                value={s.species}
                onSave={(v) =>
                  run(() => actions.editField(s.id, "species", v), "物种名称已更新")
                }
              />
              <FieldEditor
                label="采集地点"
                value={s.location}
                onSave={(v) =>
                  run(() => actions.editField(s.id, "location", v), "采集地点已更新")
                }
              />
              <FieldEditor
                label="海拔"
                value={s.elevation}
                onSave={(v) =>
                  run(() => actions.editField(s.id, "elevation", v), "海拔已更新")
                }
              />
              <FieldEditor
                label="采集人"
                value={s.collector}
                onSave={(v) =>
                  run(() => actions.editField(s.id, "collector", v), "采集人已更新")
                }
              />
              <FieldEditor
                label="生境描述"
                value={s.habitat}
                onSave={(v) =>
                  run(() => actions.editField(s.id, "habitat", v), "生境描述已更新")
                }
              />
            </div>
          </section>

          <section>
            <h3>压制与鉴定</h3>
            <div className="status-rows">
              <div className="status-row">
                <span>压制状态</span>
                <Segmented<PressStatus>
                  ariaLabel="压制状态"
                  value={s.press}
                  options={[
                    { value: "pending", label: "待压制" },
                    { value: "pressed", label: "已压制" },
                  ]}
                  onChange={(v) =>
                    run(() => actions.setPress(s.id, v), "压制状态已更新")
                  }
                />
              </div>
              <div className="status-row">
                <span>鉴定状态</span>
                <Segmented<IdenStatus>
                  ariaLabel="鉴定状态"
                  value={s.iden}
                  options={[
                    { value: "pending", label: "待鉴定" },
                    { value: "passed", label: "鉴定通过" },
                    { value: "rejected", label: "鉴定未通过" },
                  ]}
                  onChange={(v) =>
                    run(() => actions.setIden(s.id, v), "鉴定状态已更新")
                  }
                />
              </div>
            </div>
          </section>

          <section>
            <h3>馆藏柜位</h3>
            {s.cabinet ? (
              <div className="cabinet-assigned">
                <div>
                  <p className="assigned-label">当前柜位</p>
                  <strong>{s.cabinet}</strong>
                  <span>标本已入库 · 入库后流程状态不可回退</span>
                </div>
                <div className="cabinet-actions">
                  <div className="cabinet-input-line">
                    <input
                      value={cabinetInput}
                      placeholder="输入新柜位编号"
                      onChange={(e) => {
                        setCabinetInput(e.target.value);
                        setCabinetError(null);
                      }}
                    />
                    <button onClick={doAssign}>调整到新柜位</button>
                  </div>
                  <ConfirmAction
                    idle="撤出柜位（退回待上柜）"
                    confirm="再次确认撤出"
                    onConfirm={() =>
                      run(() => actions.releaseCabinet(s.id), "已撤出柜位")
                    }
                  />
                  {cabinetError && <p className="inline-error">{cabinetError}</p>}
                </div>
              </div>
            ) : (
              <div className="cabinet-assign">
                <ul className="check-list">
                  <li className={s.press === "pressed" ? "ok" : "bad"}>
                    {s.press === "pressed" ? "✓" : "✗"} 压制完成
                  </li>
                  <li className={s.iden === "passed" ? "ok" : "bad"}>
                    {s.iden === "passed" ? "✓" : "✗"} 鉴定通过
                  </li>
                </ul>
                {missing.length > 0 ? (
                  <p className="missing-hint">
                    暂不能分配柜位，缺项：{missing.join("、")}。记录保留在待处理队列。
                  </p>
                ) : (
                  <p className="ready-hint">条件齐备，可填写柜位编号办理上柜。</p>
                )}
                <div className="cabinet-input-line">
                  <input
                    value={cabinetInput}
                    placeholder="柜位编号，如 B-12-05"
                    disabled={missing.length > 0}
                    onChange={(e) => {
                      setCabinetInput(e.target.value);
                      setCabinetError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && missing.length === 0) doAssign();
                    }}
                  />
                  <button
                    className="primary"
                    disabled={missing.length > 0 || !cabinetInput.trim()}
                    onClick={doAssign}
                  >
                    分配柜位并入库
                  </button>
                </div>
                {cabinetError && <p className="inline-error">{cabinetError}</p>}
                {taken.length > 0 && (
                  <p className="occupied-hint">
                    已占用柜位（不可重复分配）：
                    {taken.map((x) => (
                      <span key={x.id} className="occupied-chip">
                        {x.cabinet}（{x.code}）
                      </span>
                    ))}
                  </p>
                )}
              </div>
            )}
          </section>

          <section>
            <h3>历次变更（{s.history.length}）</h3>
            <ol className="history">
              {s.history.map((h) => (
                <li key={h.id}>
                  <time>{formatTime(h.time)}</time>
                  <div>
                    <strong>{h.action}</strong>
                    {h.detail && <p>{h.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <footer className="modal-foot">
          <small>登记于 {formatTime(s.createdAt)} · 数据仅保存在本浏览器</small>
          <ConfirmAction
            idle="删除该记录"
            confirm="再次确认删除"
            onConfirm={() => {
              const r = actions.removeSpecimen(s.id);
              if (r.ok) {
                notify("记录已删除", "ok");
                onDeleted();
              } else {
                notify(r.error ?? "删除失败", "err");
              }
            }}
          />
        </footer>
      </div>
    </div>
  );
}
