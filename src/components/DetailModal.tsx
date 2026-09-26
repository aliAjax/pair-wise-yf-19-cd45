import { useState } from "react";
import type { IdentifyStatus, PressStatus, Specimen } from "../types";
import { IDENTIFY_LABEL, PRESS_LABEL, STAGE_LABEL } from "../types";
import { fieldSummary, formatTime, isCabinetOccupied, missingRequirements } from "../logic";

interface Props {
  specimen: Specimen;
  allSpecimens: Specimen[];
  onClose: () => void;
  onEditInfo: (id: string, patch: Partial<Specimen>) => void;
  onSetPress: (id: string, press: PressStatus) => void;
  onSetIdentify: (id: string, identify: IdentifyStatus) => void;
  onAssign: (id: string, code: string) => void;
  onRelease: (id: string) => void;
}

export default function DetailModal(props: Props) {
  const { specimen: s, onClose } = props;
  const [cabinet, setCabinet] = useState("");
  const [cabinetError, setCabinetError] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    species: s.species,
    location: s.location,
    altitude: s.altitude,
    habitat: s.habitat,
    collector: s.collector,
  });
  const [editError, setEditError] = useState("");

  const missing = missingRequirements(s);
  const ready = missing.length === 0;

  const assign = () => {
    const code = cabinet.trim();
    if (!code) return setCabinetError("请填写柜位编号");
    if (!ready) {
      setCabinetError(`不满足入库条件：${missing.join("、")}`);
      return;
    }
    if (isCabinetOccupied(props.allSpecimens, code, s.id)) {
      setCabinetError(`柜位 ${code.toUpperCase()} 已被占用，不能重复分配`);
      return;
    }
    props.onAssign(s.id, code.toUpperCase());
    setCabinet("");
    setCabinetError("");
  };

  const saveInfo = () => {
    if (!draft.species.trim()) return setEditError("物种名称不能为空");
    if (!draft.location.trim()) return setEditError("采集地点不能为空");
    if (!draft.collector.trim()) return setEditError("采集人不能为空");
    props.onEditInfo(s.id, {
      species: draft.species.trim(),
      location: draft.location.trim(),
      altitude: draft.altitude.trim(),
      habitat: draft.habitat.trim(),
      collector: draft.collector.trim(),
    });
    setEditError("");
    setEditing(false);
  };

  return (
    <div className="modal-mask" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <p>标本详情</p>
            <h2>{s.collectionNo}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </header>

        <div className="modal-body">
          <section className="detail-block">
            <div className="block-head">
              <h3>采集信息卡</h3>
              {!editing && (
                <button className="ghost small" onClick={() => setEditing(true)}>
                  修改信息
                </button>
              )}
            </div>

            {editing ? (
              <div className="field-grid">
                <label className="span-2">
                  <span>物种名称 *</span>
                  <input
                    value={draft.species}
                    onChange={(e) => setDraft({ ...draft, species: e.target.value })}
                  />
                </label>
                <label className="span-2">
                  <span>采集地点 *</span>
                  <input
                    value={draft.location}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  />
                </label>
                <label>
                  <span>海拔</span>
                  <input
                    value={draft.altitude}
                    onChange={(e) => setDraft({ ...draft, altitude: e.target.value })}
                  />
                </label>
                <label>
                  <span>采集人 *</span>
                  <input
                    value={draft.collector}
                    onChange={(e) => setDraft({ ...draft, collector: e.target.value })}
                  />
                </label>
                <label className="span-2">
                  <span>生境描述</span>
                  <input
                    value={draft.habitat}
                    onChange={(e) => setDraft({ ...draft, habitat: e.target.value })}
                  />
                </label>
                {editError && <p className="form-error span-2">⚠ {editError}</p>}
                <div className="span-2 inline-actions">
                  <button className="primary small" onClick={saveInfo}>
                    保存变更
                  </button>
                  <button
                    className="ghost small"
                    onClick={() => {
                      setEditing(false);
                      setEditError("");
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <dl className="info-grid">
                {fieldSummary(s).map(([k, v]) => (
                  <div key={k} className="info-item">
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="detail-block">
            <h3>压制与鉴定</h3>
            <div className="status-row">
              <label>
                <span>压制状态</span>
                <select
                  value={s.press}
                  disabled={s.stage === "stored"}
                  onChange={(e) =>
                    props.onSetPress(s.id, e.target.value as PressStatus)
                  }
                >
                  <option value="pending">未压制</option>
                  <option value="done">压制完成</option>
                </select>
              </label>
              <label>
                <span>鉴定状态</span>
                <select
                  value={s.identify}
                  disabled={s.stage === "stored"}
                  onChange={(e) =>
                    props.onSetIdentify(s.id, e.target.value as IdentifyStatus)
                  }
                >
                  <option value="unidentified">待鉴定</option>
                  <option value="passed">鉴定通过</option>
                  <option value="failed">鉴定未通过</option>
                </select>
              </label>
              <div className={`stage-tag stage-${s.stage}`}>
                {STAGE_LABEL[s.stage]}
              </div>
            </div>
            {s.stage === "stored" && (
              <p className="form-hint">已入库标本的压制 / 鉴定状态已锁定。</p>
            )}
          </section>

          <section className="detail-block">
            <h3>柜位分配与入库</h3>
            {s.stage === "stored" ? (
              <div className="cabinet-done">
                <p>
                  当前柜位 <strong>{s.locationCode}</strong>，已于 {formatTime(s.updatedAt)} 办理入库。
                </p>
                <button
                  className="ghost small danger"
                  onClick={() => props.onRelease(s.id)}
                >
                  撤出柜位（退回待处理）
                </button>
              </div>
            ) : (
              <>
                {ready ? (
                  <p className="req-line ok">
                    ✓ 压制完成、鉴定通过，可分配柜位办理入库。
                  </p>
                ) : (
                  <p className="req-line wait">
                    暂不可分配柜位，缺项：
                    {missing.map((m) => (
                      <span key={m} className="missing-tag">{m}</span>
                    ))}
                  </p>
                )}
                <div className="cabinet-row">
                  <input
                    value={cabinet}
                    placeholder="柜位编号，如 B-12-05"
                    disabled={!ready}
                    onChange={(e) => {
                      setCabinet(e.target.value);
                      setCabinetError("");
                    }}
                  />
                  <button className="primary" disabled={!ready} onClick={assign}>
                    分配柜位并入库
                  </button>
                </div>
                {cabinetError && <p className="form-error">⚠ {cabinetError}</p>}
              </>
            )}
          </section>

          <section className="detail-block">
            <h3>历次变更（{s.history.length}）</h3>
            <ol className="timeline">
              {[...s.history].reverse().map((h) => (
                <li key={h.id}>
                  <span className="tl-dot" />
                  <div>
                    <div className="tl-head">
                      <b>{h.action}</b>
                      <time>{formatTime(h.at)}</time>
                    </div>
                    <p>{h.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
